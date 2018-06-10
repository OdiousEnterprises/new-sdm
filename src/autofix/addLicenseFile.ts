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
    AutofixRegistration,
    editorAutofixRegistration,
} from "@atomist/sdm";
import { hasFile } from "@atomist/sdm";
import { not } from "@atomist/sdm";
import axios from "axios";

export const LicenseFilename = "LICENSE";

export const AddLicenseFile: AutofixRegistration = editorAutofixRegistration({
    name: "License Fix",
    pushTest: not(hasFile(LicenseFilename)),
    editor: async p => {
        const license = await axios.get("https://www.apache.org/licenses/LICENSE-2.0.txt");
        return p.addFile("LICENSE", license.data);
    },
});
