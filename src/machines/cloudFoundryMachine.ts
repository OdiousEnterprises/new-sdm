/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    AnyPush,
    FromAtomist,
    given,
    Goals,
    hasFile,
    IsDeployEnabled,
    NamedSeedRepo,
    not,
    onAnyPush,
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    ProductionUndeploymentGoal,
    SoftwareDeliveryMachine,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    ToDefaultBranch,
    whenPushSatisfies,
} from "@atomist/sdm";

import * as build from "@atomist/sdm/dsl/buildDsl";
import { isDeployEnabledCommand } from "@atomist/sdm/handlers/commands/DisplayDeployEnablement";
import { disableDeploy, enableDeploy } from "@atomist/sdm/handlers/commands/SetDeployEnablement";
import { createSoftwareDeliveryMachine } from "@atomist/sdm/machine/machineFactory";
import { IsMaven } from "@atomist/sdm/mapping/pushtest/jvm/jvmPushTests";
import { HasAtomistBuildFile, IsNode } from "@atomist/sdm/mapping/pushtest/node/nodePushTests";
import { HasCloudFoundryManifest } from "@atomist/sdm/mapping/pushtest/pcf/cloudFoundryManifestPushTest";
import { ToPublicRepo } from "@atomist/sdm/mapping/pushtest/toPublicRepo";
import { LocalDeploymentGoals } from "../deploy/localDeploymentGoals";
import { LocalExecutableJarDeployer } from "../deploy/localSpringBootDeployers";
import { CloudReadinessChecks } from "../pack/cloud-readiness/cloudReadiness";
import { DemoEditors } from "../pack/demo-editors/demoEditors";
import { JavaSupport } from "../pack/java/javaSupport";
import { NodeSupport } from "../pack/node/nodeSupport";
import { MaterialChangeToNodeRepo } from "../pack/node/pushtest/materialChangeToNodeRepo";
import {
    cloudFoundryProductionDeploySpec,
    cloudFoundryStagingDeploySpec,
    EnableDeployOnCloudFoundryManifestAddition,
} from "../pack/pcf/cloudFoundryDeploy";
import { SuggestAddingCloudFoundryManifest } from "../pack/pcf/suggestAddingCloudFoundryManifest";
import { SentrySupport } from "../pack/sentry/sentrySupport";
import { MaterialChangeToJavaRepo } from "../pack/spring/pushtest/materialChangeToJavaRepo";
import { HasSpringBootApplicationClass } from "../pack/spring/pushtest/springPushTests";
import { SpringSupport } from "../pack/spring/springSupport";
import { addTeamPolicies } from "./teamPolicies";

import * as deploy from "@atomist/sdm/dsl/deployDsl";
import { MavenBuilder } from "@atomist/sdm/internal/delivery/build/local/maven/MavenBuilder";
import { nodeBuilder } from "@atomist/sdm/internal/delivery/build/local/npm/npmBuilder";
import { npmCustomBuilder } from "@atomist/sdm/internal/delivery/build/local/npm/NpmDetectBuildMapping";
import { ManagedDeploymentTargeter } from "@atomist/sdm/internal/delivery/deploy/local/ManagedDeployments";

import { createEphemeralProgressLog } from "@atomist/sdm/api-helper/log/EphemeralProgressLog";
import { SoftwareDeliveryMachineConfiguration } from "@atomist/sdm/api/machine/SoftwareDeliveryMachineOptions";
import { NoGoals, StagingUndeploymentGoal } from "@atomist/sdm/goal/common/commonGoals";
import {
    HttpServiceGoals,
    RepositoryDeletionGoals,
    UndeployEverywhereGoals,
} from "@atomist/sdm/goal/common/httpServiceGoals";
import { LibraryGoals } from "@atomist/sdm/goal/common/libraryGoals";
import {
    NpmBuildGoals,
    NpmDeployGoals,
    NpmDockerGoals,
    NpmKubernetesDeployGoals,
} from "@atomist/sdm/goal/common/npmGoals";
import { HasDockerfile } from "@atomist/sdm/mapping/pushtest/docker/dockerPushTests";
import { lookFor200OnEndpointRootGet } from "@atomist/sdm/util/verify/lookFor200OnEndpointRootGet";
import { CloudFoundrySupport } from "../pack/pcf/cloudFoundrySupport";

/**
 * Assemble a machine that supports Java, Spring and Node and deploys to Cloud Foundry
 * See generatorConfig.ts to customize generation defaults.
 * @return {SoftwareDeliveryMachine}
 */
export function cloudFoundryMachine(
    configuration: SoftwareDeliveryMachineConfiguration): SoftwareDeliveryMachine {
    const sdm = createSoftwareDeliveryMachine(
        {
            name: "CloudFoundry software delivery machine",
            configuration,
        },
        given<Goals>(IsMaven).itMeans("Maven")
            .then(
                whenPushSatisfies(HasSpringBootApplicationClass, not(MaterialChangeToJavaRepo))
                    .itMeans("No material change to Java")
                    .setGoals(NoGoals),
                whenPushSatisfies(ToDefaultBranch, HasSpringBootApplicationClass, HasCloudFoundryManifest,
                    ToPublicRepo, not(NamedSeedRepo), not(FromAtomist), IsDeployEnabled)
                    .itMeans("Spring Boot service to deploy")
                    .setGoals(HttpServiceGoals),
                whenPushSatisfies(HasSpringBootApplicationClass, not(FromAtomist))
                    .itMeans("Spring Boot service local deploy")
                    .setGoals(LocalDeploymentGoals),
                onAnyPush.itMeans("Build Java library")
                    .set(LibraryGoals),
            ),
        whenPushSatisfies(IsNode, not(MaterialChangeToNodeRepo))
            .itMeans("No material change to Node")
            .setGoals(NoGoals),
        whenPushSatisfies(IsNode, HasCloudFoundryManifest, IsDeployEnabled, ToDefaultBranch)
            .itMeans("Build and deploy Node")
            .setGoals(NpmDeployGoals),
        whenPushSatisfies(IsNode, HasDockerfile, ToDefaultBranch, IsDeployEnabled)
            .itMeans("Docker deploy Node")
            .setGoals(NpmKubernetesDeployGoals),
        whenPushSatisfies(IsNode, HasDockerfile)
            .itMeans("Docker build Node")
            .setGoals(NpmDockerGoals),
        whenPushSatisfies(IsNode, not(HasDockerfile))
            .itMeans("Build Node")
            .setGoals(NpmBuildGoals),
    );

    const hasPackageLock = hasFile("package-lock.json");

    sdm.addBuildRules(
        build.when(HasAtomistBuildFile)
            .itMeans("Custom build script")
            .set(npmCustomBuilder(configuration.artifactStore, configuration.projectLoader)),
        build.when(IsNode, ToDefaultBranch, hasPackageLock)
            .itMeans("npm run build")
            .set(nodeBuilder(configuration.projectLoader, "npm ci", "npm run build")),
        build.when(IsNode, hasPackageLock)
            .itMeans("npm run compile")
            .set(nodeBuilder(configuration.projectLoader, "npm ci", "npm run compile")),
        build.when(IsNode, ToDefaultBranch)
            .itMeans("npm run build - no package lock")
            .set(nodeBuilder(configuration.projectLoader, "npm i", "npm run build")),
        build.when(IsNode)
            .itMeans("npm run compile - no package lock")
            .set(nodeBuilder(configuration.projectLoader, "npm i", "npm run compile")),
        build.setDefault(new MavenBuilder(configuration.artifactStore,
            createEphemeralProgressLog, configuration.projectLoader)));
    sdm.addDeployRules(
        deploy.when(IsMaven)
            .deployTo(StagingDeploymentGoal, StagingEndpointGoal, StagingUndeploymentGoal)
            .using(
                {
                    deployer: LocalExecutableJarDeployer,
                    targeter: ManagedDeploymentTargeter,
                },
            ),
        deploy.when(IsMaven)
            .deployTo(ProductionDeploymentGoal, ProductionEndpointGoal, ProductionUndeploymentGoal)
            .using(cloudFoundryProductionDeploySpec(configuration.sdm)),
        deploy.when(IsNode)
            .itMeans("node run test")
            .deployTo(StagingDeploymentGoal, StagingEndpointGoal, StagingUndeploymentGoal)
            .using(cloudFoundryStagingDeploySpec(configuration.sdm)),
    );
    sdm.addDisposalRules(
        whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, HasCloudFoundryManifest)
            .itMeans("Java project to undeploy from PCF")
            .setGoals(UndeployEverywhereGoals),
        whenPushSatisfies(IsNode, HasCloudFoundryManifest)
            .itMeans("Node project to undeploy from PCF")
            .setGoals(UndeployEverywhereGoals),
        whenPushSatisfies(AnyPush)
            .itMeans("We can always delete the repo")
            .setGoals(RepositoryDeletionGoals));
    sdm.addChannelLinkListeners(SuggestAddingCloudFoundryManifest)
        .addSupportingCommands(
            enableDeploy,
            disableDeploy,
            isDeployEnabledCommand,
        )
        .addPushReactions(EnableDeployOnCloudFoundryManifestAddition)
        .addEndpointVerificationListeners(lookFor200OnEndpointRootGet());

    sdm.addExtensionPacks(
        DemoEditors,
        SpringSupport,
        SentrySupport,
        CloudReadinessChecks,
        JavaSupport,
        NodeSupport,
        CloudFoundrySupport,
    );
    addTeamPolicies(sdm);
    // DemoPolicies(sdm, configuration);
    return sdm;
}
