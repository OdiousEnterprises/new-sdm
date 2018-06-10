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

import { ExtensionPack } from "@atomist/sdm";
import { RemoveFileEditor } from "../../commands/editors/helper/removeFile";
import { AffirmationEditor } from "./affirmationEditor";
import { BreakJavaBuildEditor, UnbreakJavaBuildEditor } from "./breakJavaBuild";
import { BreakNodeBuildEditor, UnbreakNodeBuildEditor } from "./breakNodeBuild";
import { JavaAffirmationEditor } from "./javaAffirmationEditor";
import { WhackHeaderEditor } from "./removeTypeScriptHeader";

/**
 * Editors for use in demos
 * @param {SoftwareDeliveryMachine} softwareDeliveryMachine
 */
export const DemoEditors: ExtensionPack = {
    name: "DemoEditors",
    vendor: "Atomist",
    version: "0.1.0",
    configure: sdm =>
        sdm
            .addEditors(
                BreakNodeBuildEditor,
                UnbreakNodeBuildEditor,
                WhackHeaderEditor,
                JavaAffirmationEditor,
                AffirmationEditor,
                BreakJavaBuildEditor,
                RemoveFileEditor,
                UnbreakJavaBuildEditor),
};
