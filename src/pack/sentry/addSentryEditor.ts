import { ProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { EditorRegistration } from "@atomist/sdm";
import { appendOrCreateFileContent } from "@atomist/sdm/util/project/appendOrCreate";
import { copyFileFromUrl } from "@atomist/sdm/util/project/fileCopy";
import { addDependencyEditor } from "@atomist/spring-automation/commands/editor/maven/addDependencyEditor";

import { Parameter } from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { VersionedArtifact } from "@atomist/sdm/internal/delivery/build/local/maven/VersionedArtifact";

const SentryDependency: VersionedArtifact = {
    group: "io.sentry",
    artifact: "sentry-spring",
    version: "1.7.5",
};

const sentryYaml = dsn => `\nraven:
    dsn: '${dsn}'`;

function addSentryEditor(dsn: string): ProjectEditor {
    return chainEditors(
        addDependencyEditor(SentryDependency),
        // tslint:disable-next-line:max-line-length
        copyFileFromUrl("https://raw.githubusercontent.com/sdm-org/cd20/dc16c15584d77db6cf9a70fdcb4d7bebe24113d5/src/main/java/com/atomist/SentryConfiguration.java",
            "src/main/java/com/atomist/SentryConfiguration.java"),
        appendOrCreateFileContent({ toAppend: sentryYaml(dsn), path: "src/main/resources/application.yml" }),
        appendOrCreateFileContent({ toAppend: sentryYaml(dsn), path: "src/test/resources/application.yml" }),
    );
}

@Parameters()
export class AddSentryParams {

    @Parameter()
    public dsn: string;
}

/**
 * Command to add Sentry support to the current project
 * @type {HandleCommand<EditOneOrAllParameters>}
 */
export const AddSentry: EditorRegistration<AddSentryParams> = {
    createEditor: params => addSentryEditor(params.dsn),
    name: "AddSentry",
    paramsMaker: AddSentryParams,
    editMode: () => new PullRequest(
        `add-sentry-${new Date().getTime()}`,
        "Add Sentry support",
        "Adds Sentry (Raven) APM support"),
    intent: "add sentry",
};
