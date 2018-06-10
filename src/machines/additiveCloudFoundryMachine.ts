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
    any,
    AnyPush,
    ArtifactGoal,
    goalContributors,
    Goals,
    JustBuildGoal,
    LocalDeploymentGoal,
    not,
    onAnyPush,
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    ProductionUndeploymentGoal,
    PushReactionGoal,
    ReviewGoal,
    SoftwareDeliveryMachine,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
    ToDefaultBranch,
    whenPushSatisfies,
} from "@atomist/sdm";
import { createEphemeralProgressLog } from "@atomist/sdm/api-helper/log/EphemeralProgressLog";
import { SoftwareDeliveryMachineConfiguration } from "@atomist/sdm/api/machine/SoftwareDeliveryMachineOptions";
import * as build from "@atomist/sdm/dsl/buildDsl";
import * as deploy from "@atomist/sdm/dsl/deployDsl";
import { StagingUndeploymentGoal } from "@atomist/sdm/goal/common/commonGoals";
import { RepositoryDeletionGoals, UndeployEverywhereGoals } from "@atomist/sdm/goal/common/httpServiceGoals";
import { isDeployEnabledCommand } from "@atomist/sdm/handlers/commands/DisplayDeployEnablement";
import { disableDeploy, enableDeploy } from "@atomist/sdm/handlers/commands/SetDeployEnablement";
import { MavenBuilder } from "@atomist/sdm/internal/delivery/build/local/maven/MavenBuilder";
import { ManagedDeploymentTargeter } from "@atomist/sdm/internal/delivery/deploy/local/ManagedDeployments";
import { createSoftwareDeliveryMachine } from "@atomist/sdm/machine/machineFactory";
import { IsMaven } from "@atomist/sdm/mapping/pushtest/jvm/jvmPushTests";
import { IsNode } from "@atomist/sdm/mapping/pushtest/node/nodePushTests";
import { HasCloudFoundryManifest } from "@atomist/sdm/mapping/pushtest/pcf/cloudFoundryManifestPushTest";
import {
    deploymentFreeze,
    ExplainDeploymentFreezeGoal,
    isDeploymentFrozen,
} from "@atomist/sdm/pack/freeze/deploymentFreeze";
import { InMemoryDeploymentStatusManager } from "@atomist/sdm/pack/freeze/InMemoryDeploymentStatusManager";
import { lookFor200OnEndpointRootGet } from "@atomist/sdm/util/verify/lookFor200OnEndpointRootGet";
import { LocalExecutableJarDeployer } from "../deploy/localSpringBootDeployers";
import { CloudReadinessChecks } from "../pack/cloud-readiness/cloudReadiness";
import { DemoEditors } from "../pack/demo-editors/demoEditors";
import { JavaSupport } from "../pack/java/javaSupport";
import { NodeSupport } from "../pack/node/nodeSupport";
import {
    cloudFoundryProductionDeploySpec,
    EnableDeployOnCloudFoundryManifestAddition,
} from "../pack/pcf/cloudFoundryDeploy";
import { CloudFoundrySupport } from "../pack/pcf/cloudFoundrySupport";
import { SentrySupport } from "../pack/sentry/sentrySupport";
import { HasSpringBootApplicationClass } from "../pack/spring/pushtest/springPushTests";
import { SpringSupport } from "../pack/spring/springSupport";
import { addTeamPolicies } from "./teamPolicies";

const freezeStore = new InMemoryDeploymentStatusManager();

const IsDeploymentFrozen = isDeploymentFrozen(freezeStore);

/**
 * Variant of cloudFoundryMachine that uses additive, "contributor" style goal setting.
 * @return {SoftwareDeliveryMachine}
 */
export function additiveCloudFoundryMachine(configuration: SoftwareDeliveryMachineConfiguration): SoftwareDeliveryMachine {
    const sdm: SoftwareDeliveryMachine = createSoftwareDeliveryMachine(
        {
            name: "CloudFoundry software delivery machine",
            configuration,
        },
        // Each contributor contributes goals. The infrastructure assembles them into a goal set.
        goalContributors(
            onAnyPush.setGoals(new Goals("Checks", ReviewGoal, PushReactionGoal)),
            whenPushSatisfies(IsDeploymentFrozen)
                .setGoals(ExplainDeploymentFreezeGoal),
            whenPushSatisfies(any(IsMaven, IsNode))
                .setGoals(JustBuildGoal),
            whenPushSatisfies(HasSpringBootApplicationClass, not(ToDefaultBranch))
                .setGoals(LocalDeploymentGoal),
            whenPushSatisfies(HasCloudFoundryManifest, ToDefaultBranch)
                .setGoals([ArtifactGoal,
                    StagingDeploymentGoal,
                    StagingEndpointGoal,
                    StagingVerifiedGoal]),
            whenPushSatisfies(HasCloudFoundryManifest, not(IsDeploymentFrozen), ToDefaultBranch)
                .setGoals([ArtifactGoal,
                    ProductionDeploymentGoal,
                    ProductionEndpointGoal]),
        ));

    sdm.addExtensionPacks(
        DemoEditors,
        deploymentFreeze(freezeStore),
        SpringSupport,
        SentrySupport,
        CloudReadinessChecks,
        JavaSupport,
        NodeSupport,
        CloudFoundrySupport,
    );

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
    );
    sdm.addDisposalRules(
        whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, HasCloudFoundryManifest)
            .itMeans("Java project to undeploy from PCF")
            .setGoals(UndeployEverywhereGoals),
        whenPushSatisfies(AnyPush)
            .itMeans("We can always delete the repo")
            .setGoals(RepositoryDeletionGoals))
        .addSupportingCommands(
            enableDeploy,
            disableDeploy,
            isDeployEnabledCommand,
        )
        .addPushReactions(EnableDeployOnCloudFoundryManifestAddition)
        .addEndpointVerificationListeners(lookFor200OnEndpointRootGet());
    addTeamPolicies(sdm);

    // sdm.addExtensionPacks(DemoPolicies);

    sdm.addBuildRules(
        build.setDefault(new MavenBuilder(configuration.sdm.artifactStore,
            createEphemeralProgressLog, configuration.sdm.projectLoader)));

    return sdm;
}
