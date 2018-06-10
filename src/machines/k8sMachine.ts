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
    FromAtomist,
    IsDeployEnabled,
    not,
    ProductionDeploymentGoal,
    SoftwareDeliveryMachine,
    StagingDeploymentGoal,
    ToDefaultBranch,
    whenPushSatisfies,
} from "@atomist/sdm";
import { SoftwareDeliveryMachineConfiguration } from "@atomist/sdm/api/machine/SoftwareDeliveryMachineOptions";
import * as build from "@atomist/sdm/dsl/buildDsl";
import { NoGoals } from "@atomist/sdm/goal/common/commonGoals";
import { HttpServiceGoals } from "@atomist/sdm/goal/common/httpServiceGoals";
import { LibraryGoals } from "@atomist/sdm/goal/common/libraryGoals";
import { NpmBuildGoals, NpmDeployGoals } from "@atomist/sdm/goal/common/npmGoals";
import { disableDeploy, enableDeploy } from "@atomist/sdm/handlers/commands/SetDeployEnablement";
import { requestDeployToK8s } from "@atomist/sdm/handlers/events/delivery/deploy/k8s/RequestK8sDeploys";
import { K8sAutomationBuilder } from "@atomist/sdm/internal/delivery/build/k8s/K8AutomationBuilder";
import { createSoftwareDeliveryMachine } from "@atomist/sdm/machine/machineFactory";
import { IsMaven } from "@atomist/sdm/mapping/pushtest/jvm/jvmPushTests";
import { IsNode } from "@atomist/sdm/mapping/pushtest/node/nodePushTests";
import { ToPublicRepo } from "@atomist/sdm/mapping/pushtest/toPublicRepo";
import { lookFor200OnEndpointRootGet } from "@atomist/sdm/util/verify/lookFor200OnEndpointRootGet";
import { AddK8sSpec } from "../commands/editors/k8s/addK8sSpec";
import { HasK8Spec } from "../commands/editors/k8s/k8sSpecPushTest";
import {
    K8sProductionDomain,
    K8sTestingDomain,
    noticeK8sProdDeployCompletion,
    NoticeK8sTestDeployCompletion,
} from "../deploy/k8sDeploy";
import { LocalDeploymentGoals } from "../deploy/localDeploymentGoals";
import { SuggestAddingK8sSpec } from "../listener/channel-link/suggestAddingK8sSpec";
import { DemoEditors } from "../pack/demo-editors/demoEditors";
import { JavaSupport } from "../pack/java/javaSupport";
import { MaterialChangeToJavaRepo } from "../pack/spring/pushtest/materialChangeToJavaRepo";
import { HasSpringBootApplicationClass } from "../pack/spring/pushtest/springPushTests";
import { SpringSupport } from "../pack/spring/springSupport";
import { addTeamPolicies } from "./teamPolicies";

export function k8sMachine(
                           configuration: SoftwareDeliveryMachineConfiguration): SoftwareDeliveryMachine {
    const sdm = createSoftwareDeliveryMachine({
            name: "K8s software delivery machine",
            configuration,
        },
        whenPushSatisfies(IsMaven, not(MaterialChangeToJavaRepo))
            .itMeans("Immaterial change")
            .setGoals(NoGoals),
        whenPushSatisfies(
            ToDefaultBranch,
            IsMaven,
            HasSpringBootApplicationClass,
            HasK8Spec,
            ToPublicRepo,
            IsDeployEnabled)
            .itMeans("Spring Boot service to deploy")
            .setGoals(HttpServiceGoals),
        whenPushSatisfies(not(FromAtomist), IsMaven, HasSpringBootApplicationClass)
            .itMeans("Spring Boot service local deploy")
            .setGoals(LocalDeploymentGoals),
        whenPushSatisfies(IsMaven, MaterialChangeToJavaRepo)
            .itMeans("Build Java")
            .setGoals(LibraryGoals),
        whenPushSatisfies(IsNode, IsDeployEnabled, ToDefaultBranch)
            .itMeans("Build and deploy node")
            .setGoals(NpmDeployGoals),
        whenPushSatisfies(IsNode)
            .itMeans("Build with npm")
            .setGoals(NpmBuildGoals),
    );
    sdm.addBuildRules(
        build.setDefault(new K8sAutomationBuilder()))
        .addGoalImplementation("K8TestDeploy",
            StagingDeploymentGoal,
            requestDeployToK8s(K8sTestingDomain))
        .addGoalImplementation("K8ProductionDeploy",
            ProductionDeploymentGoal,
            requestDeployToK8s(K8sProductionDomain))
        .addChannelLinkListeners(SuggestAddingK8sSpec)
        .addSupportingCommands(
            () => AddK8sSpec,
            enableDeploy,
            disableDeploy,
        )
        .addSupportingEvents(() => NoticeK8sTestDeployCompletion,
            () => noticeK8sProdDeployCompletion(sdm.configuration.sdm.repoRefResolver))
        .addEndpointVerificationListeners(
            lookFor200OnEndpointRootGet({
                retries: 15,
                maxTimeout: 5000,
                minTimeout: 3000,
            }),
        );

    sdm.addExtensionPacks(
        DemoEditors,
        JavaSupport,
        SpringSupport,
    );
    addTeamPolicies(sdm);

    return sdm;
}
