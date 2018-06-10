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

import { DeployerInfo, ProjectLoader, PushImpactListener, PushReactionRegistration } from "@atomist/sdm";
import { setDeployEnablement } from "@atomist/sdm/handlers/commands/SetDeployEnablement";
import { CloudFoundryBlueGreenDeployer } from "@atomist/sdm/pack/pcf/CloudFoundryBlueGreenDeployer";
import { CloudFoundryInfo } from "@atomist/sdm/pack/pcf/CloudFoundryTarget";
import { EnvironmentCloudFoundryTarget } from "@atomist/sdm/pack/pcf/EnvironmentCloudFoundryTarget";
import { ArtifactStore } from "@atomist/sdm/spi/artifact/ArtifactStore";
import { AddCloudFoundryManifestMarker } from "./addCloudFoundryManifest";

/**
 * Deploy everything to the same Cloud Foundry space
 */
export function cloudFoundryStagingDeploySpec(opts: {artifactStore: ArtifactStore, projectLoader: ProjectLoader}): DeployerInfo<CloudFoundryInfo> {
    return {
        deployer: new CloudFoundryBlueGreenDeployer(opts.projectLoader),
        targeter: () => new EnvironmentCloudFoundryTarget("staging"),
    };
}

export function cloudFoundryProductionDeploySpec(opts: {artifactStore: ArtifactStore, projectLoader: ProjectLoader}):
    DeployerInfo<CloudFoundryInfo> {
    return {
        deployer: new CloudFoundryBlueGreenDeployer(opts.projectLoader),
        targeter: () => new EnvironmentCloudFoundryTarget("production"),
    };
}

const EnableDeployOnCloudFoundryManifestAdditionListener: PushImpactListener = async pil => {
    const commit = pil.commit;
    const repo = commit.repo;
    const push = commit.pushes[0];

    if (push.commits.some(c => c.message.includes(AddCloudFoundryManifestMarker))) {
        await setDeployEnablement(true)
        (pil.context, {repo: repo.name, owner: repo.owner, providerId: repo.org.provider.providerId});
    }
};

/**
 * Enable deployment when a PCF manifest is added to the default branch.
 */
export const EnableDeployOnCloudFoundryManifestAddition: PushReactionRegistration = {
    name: "EnableDeployOnCloudFoundryManifestAddition",
    action: EnableDeployOnCloudFoundryManifestAdditionListener,
};
