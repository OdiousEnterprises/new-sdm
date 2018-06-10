import { logger } from "@atomist/automation-client";
import { ReviewerRegistration, ToDefaultBranch } from "@atomist/sdm";
import { StringCapturingProgressLog } from "@atomist/sdm/api-helper/log/StringCapturingProgressLog";
import { asSpawnCommand, spawnAndWatch } from "@atomist/sdm/util/misc/spawned";

export interface SonarCubeOptions {
    url: string;
    org: string;
    token: string;
}

export function sonarQubeReviewer(options: SonarCubeOptions): ReviewerRegistration {
    return {
        name: "SonarQube review",
        pushTest: ToDefaultBranch,
        action: async pli => {
            const command = `mvn clean org.jacoco:jacoco-maven-plugin:prepare-agent package sonar:sonar \
    -Dsonar.host.url=${options.url} \
    -Dsonar.organization=${options.org} \
    -Dsonar.login=${options.token}`;
            const log = new StringCapturingProgressLog();
            await spawnAndWatch(
                asSpawnCommand(command),
                {
                    cwd: pli.project.baseDir,
                },
                log,
            );
            await pli.addressChannels(`Code review success`);
            logger.info(log.log);
            const parsed = Pattern.exec(log.log);
            await pli.addressChannels(`Analysis at ${parsed[ 0 ]}`);

            return {
                repoId: pli.id,
                comments: [],
            };
        },
    };
}

// ANALYSIS SUCCESSFUL, you can browse https://sonarcloud.io/dashboard/index/com.atomist.springteam:spring-rest-seed
const Pattern = /ANALYSIS SUCCESSFUL, you can browse ([^\s^[]*)/;
