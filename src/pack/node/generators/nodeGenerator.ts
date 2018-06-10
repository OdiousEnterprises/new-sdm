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

import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { GeneratorCommandDetails } from "@atomist/automation-client/operations/generate/generatorToCommand";
import { GeneratorConfig, GeneratorRegistration } from "@atomist/sdm";
import { updateReadmeTitle } from "../../../commands/editors/updateReadmeTitle";
import { updatePackageJsonIdentification } from "../editors/updatePackageJsonIdentification";
import { NodeProjectCreationParameters } from "./NodeProjectCreationParameters";

/* tslint:disable:max-line-length */

export function nodeGenerator(config: GeneratorConfig,
                              details: Partial<GeneratorCommandDetails<NodeProjectCreationParameters>> = {}): GeneratorRegistration<NodeProjectCreationParameters> {
    return {
        createEditor: transformSeed,
        paramsMaker: () => new NodeProjectCreationParameters(config),
        name: `nodeGenerator-${config.seed.repo}`,
        tags: ["node", "typescript", "generator"],
        ...details,
    };
}

function transformSeed(params: NodeProjectCreationParameters): AnyProjectEditor<NodeProjectCreationParameters> {
    return chainEditors(
        updatePackageJsonIdentification(params.appName, params.target.description,
            params.version,
            params.screenName,
            params.target.repoRef),
        updateReadmeTitle(params.appName, params.target.description),
    );
}
