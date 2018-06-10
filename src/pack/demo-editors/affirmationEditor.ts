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

import { Parameter, Parameters } from "@atomist/automation-client";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { EditorRegistration } from "@atomist/sdm";
import { RequestedCommitParameters } from "../../commands/editors/support/RequestedCommitParameters";

export const AffirmationEditorName = "affirmation";

@Parameters()
export class AffirmationParameters extends RequestedCommitParameters {

    constructor(message: string) {
        super(message);
    }

    @Parameter({required: false, pattern: /.*/})
    public readonly customAffirmation: string;
}

/**
 * Function returning a command handler around the appendAffirmationToReadMe
 * editor
 * @type {HandleCommand<EditOneOrAllParameters>}
 */
export const AffirmationEditor: EditorRegistration = {
    createEditor: () => appendAffirmationToReadMe,
    name: AffirmationEditorName,
    paramsMaker: () => new AffirmationParameters("Everyone needs encouragement"),
    editMode: ap => ap.editMode,
    intent: "edit affirmation",
};

export const affirmations = [
    "You're good enough, you're smart enough, and doggone it, people like you.",
    "I believe in you. You can do the thing!",
    "You are the delta in what you do, not the things you did in the past",
    "It’s only a thought, and a thought can be changed.",
    "Life is psychologically difficult for everybody.",
    "Our bodies and minds are capable of far more than our psyche will let us achieve.",
    "Make new mistakes as fast as you can.",
    "Finite games are played within boundaries. Infinite games play with boundaries.",
    "You belong everywhere you are.",
    "No need to say 'I can do it.' You ARE doing it!",
    "Life is its own reason for being. It is beautiful to have a sense of beauty.",
];

function randomAffirmation() {
    return affirmations[getRandomInt(affirmations.length)];
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

export const appendAffirmationToReadMe: SimpleProjectEditor<AffirmationParameters> = async (p, ctx, params) => {
    const affirmation = params.customAffirmation || randomAffirmation();
    await ctx.messageClient.respond(`Adding to \`README.md\` via \`${params.branchToUse}\`: _${affirmation}_`);
    return doWithFiles(p, "README.md", async f => {
        const content = await f.getContent();
        return f.setContent(`${content}\n${affirmation}\n`);
    });
};
