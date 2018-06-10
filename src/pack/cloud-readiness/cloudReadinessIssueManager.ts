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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { deepLink } from "@atomist/automation-client/util/gitHub";
import { CommentsFormatter, singleIssueManagingReviewListener } from "../../listener/review-listener/issueManagingReviewListeners";
import { ImportDotStarCategory } from "./reviewer/importDotStarReviewer";

import { ReviewListener } from "@atomist/sdm";
import * as _ from "lodash";
import { ImportFileIoCategory } from "./reviewer/fileIoImportReviewer";
import { HardcodePropertyCategory } from "./reviewer/hardcodedPropertyReviewer";

const CloudReadinessIssueTitle = "Service Not Yet Cloud Native";
const CloudReadinessReviewCommentCategories = [
    ImportDotStarCategory,
    ImportFileIoCategory,
    HardcodePropertyCategory,
];

const CloudReadinessCommentFilter = rc => CloudReadinessReviewCommentCategories.includes(rc.category);

const CloudReadinessBodyFormatter: CommentsFormatter = (comments, rr) => {
    const grr = rr as GitHubRepoRef;
    let body = "";

    const uniqueCategories = _.uniq(comments.map(c => c.category)).sort();
    uniqueCategories.forEach(category => {
        body += `## ${category}\n`;
        body += comments
            .filter(c => c.category === category)
            .map(c =>
                `- \`${c.sourceLocation.path || ""}\`: [${c.detail}](${deepLink(grr, c.sourceLocation)})\n`);
    });
    return body;
};
/**
 * Manage cloud readiness issue
 * @type {ReviewListener}
 */
export const CloudReadinessIssueManager: ReviewListener = singleIssueManagingReviewListener(
    CloudReadinessCommentFilter,
    CloudReadinessIssueTitle,
    CloudReadinessBodyFormatter);
