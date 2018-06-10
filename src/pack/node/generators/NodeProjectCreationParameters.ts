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

import { Parameter } from "@atomist/automation-client";

import { Parameters } from "@atomist/automation-client/decorators";
import { GitHubRepoCreationParameters } from "@atomist/automation-client/operations/generate/GitHubRepoCreationParameters";
import { NewRepoCreationParameters } from "@atomist/automation-client/operations/generate/NewRepoCreationParameters";
import { GeneratorConfig, SeedDrivenGeneratorParametersSupport } from "@atomist/sdm";

/**
 * Parameters for creating a Node project.
 */
@Parameters()
export class NodeProjectCreationParameters extends SeedDrivenGeneratorParametersSupport {

    @Parameter({
        displayName: "App name",
        description: "Application name",
        pattern: /^(@?[A-Za-z][-A-Za-z0-9_]*)$/,
        validInput: "a valid package.json application name, which starts with a lower-case letter and contains only " +
        " alphanumeric, -, and _ characters, or `${projectName}` to use the project name",
        minLength: 1,
        maxLength: 50,
        required: true,
        order: 51,
    })
    public appName: string;

    public target: NewRepoCreationParameters = new GitHubRepoCreationParameters();

    constructor(config: GeneratorConfig) {
        super(config);
    }

}
