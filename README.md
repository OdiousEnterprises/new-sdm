# new-sdm

an Atomist automation for software delivery

Instance of an Atomist Software Delivery Machine that can be used as a sample or run for real on your Java and TypeScript projects.

## What is a Software Delivery Machine?

>A **software delivery machine** is a development process in a box.

It automates all steps in the flow from commit to production (potentially via staging environments), and many other actions, using the consistent model provided by the Atomist *API for software*.

> Many teams have a blueprint in their mind for how they'd like to deliver software and ease their day to day work, but find it hard to realize. A Software Delivery Machine makes it possible.

The concept is explained in detail in Rod Johnson's blog [Why you need a Software Delivery Machine](https://the-composition.com/why-you-need-a-software-delivery-machine-85e8399cdfc0). This [video](https://vimeo.com/260496136) shows it in action.

Please see the [Atomist SDM library](https://github.com/atomist/sdm) for explanation on what an SDM can do. The present document describes how to get yours running.


## Get Started

This delivery machine feeds on the Atomist API. You'll need to be a member of an Atomist workspace to run it. <!-- TODO: reference auth story -->
Create your own by [enrolling](https://github.com/atomist/welcome/blob/master/enroll.md) at [atomist.com](https://atomist.com).

Things work best if you install an org webhook, so that Atomist receives events for all your GitHub repos.

## Get your Software Delivery Machine

If the Atomist bot is in your Slack team, type `@atomist create sdm` to have Atomist create a personalized version of
 this repository for you.

You can fork and clone this repository.

## Run Locally

This is an Atomist automation client. See [run an automation client](https://github.com/atomist/welcome/blob/master/runClient.md) for instructions on how to set up your environment and run it under Node.js.

See [integrations](#Integrations) for additional prerequisites according to the projects you're building.

The client logs to the console so you can see it go. Once it runs, here are some things to do:

### Start a new project

In Slack, `@atomist create spring`. This will create a Spring Boot repository. The SDM will build it!

To enable deployment beyond the local one, `@atomist enable deploy`.

### Push to an existing repository

If you have any Java or Node projects in your GitHub org, try linking one to a Slack channel (`@atomist link repo`), and then push to it.
You'll see Atomist react to the push, and the SDM might have some Goals it can complete.

### Customize

Every organization has a different environment and different needs. Your software delivery machine is yours: change the code and do what helps you.

In `atomist.config.ts`, you can choose the `machine` to start with. `cloudFoundryMachine` and `k8sMachine` take care of the whole delivery process from project creation through deployment, while other machines focus only on one aspect, such as project creation, static analysis or autofixing problems in repositories.

> Atomist is about developing your development experience by using your coding skills. Change the code, restart, and see your new automations and changed behavior across all your projects, within seconds.

The rest of this README describes some changes you might make.

# About this Software Delivery Machine

## Implementations of Atomist

Atomist is a flexible system, enabling you to build your own automations or use those provided by Atomist or third parties.

This repository is a *reference implementation* of Atomist, which focuses on the goals of a typical delivery
 flow. You can fork it and modify it as the starting point for your own Atomist implementation,
 or use it purely as a reference.

## Concepts

This repository shows how Atomist can automate important tasks and improve your delivery flow. Specifically:

-   How Atomist **command handlers** can be used to create services
the right way every time, and help keep them up to date
-   How Atomist **event handlers** can drive and improve a custom delivery experience, from commit through
to deployment and testing

It demonstrates Atomist as the *API for software*, exposing

-   *What we know*: The Atomist cortex, accessible through GraphQL queries and subscription joins
-   *What just happened*: An event, triggered by a GraphQL subscription, which is contextualized with the existing knowledge
-   *What you're working on*: A library that enables you to comprehend and manipulate the source code you're working on.

Atomist is not tied to GitHub, but this repository focuses on using Atomist with GitHub.com or
GitHub Enterprise.

## Key Functionality

The following key functionality of this project will be available when you run this automation client in your team:

-   *Project creation for Spring*. Atomist is not Spring specific, but we use Spring boot as an illustration here. Try `@atomist create spring`. The seed project used by default will be `spring-team/spring-rest-seed`.
    -   If you want to add or modify the content of generated projects, modify `CustomSpringBootGeneratorParameters.ts` to specify your own seed. Just about any Spring Boot project will work as the transformation of a seed project is quite forgiving, and parses the seed to find the location and name of the `@SpringBootApplication` class, rather than relying on hard coding.
    -   To perform sophisticated changes, such as dynamically computing content, modify the code in `springBootGenerator.ts`.
-   *Delivery pipeline to either Kubernetes or Pivotal Cloud Foundry for Spring Boot projects*. This includes automatic local deployment of non-default branches on the same node as the automation client. The delivery pipeline is automatically triggered on pushes.
-   *Upgrading Spring Boot version* across one or many repositories. Try `@atomist try to upgrade spring boot`. This will create a branch upgrading to Spring Boot `1.5.9` and wait for the build to complete. If the build succeeds, a PR will be created; if it fails, an issue will be created linking to the failed build log and offending branch. To choose a specific Spring Boot version, or see what happens when a bogus version triggers a failure, try `@atomist try to upgrade spring boot desiredBootVersion=<version>`. If you run such a command in a channel linked to an Atomist repository, it will affect only that repository. If you run it in a channel that is not linked, it will affect all repositories by default. You can add a `targets.repos=<regex>` parameter to specify a regular expression to target a subset of repo names. For example: `@atomist try to upgrade spring boot targets.repos=test.*`.

## Plugging in Third Party Tools

This repo shows the use of Atomist to perform many steps itself.
 However, each of the goals used by Atomist here is pluggable.

It's also easy to integrate third party tools like Checkstyle.

### Integrating CI tools

One of the tools you are most likely to integrate is CI. For example, you can integrate Jenkins, Travis or Circle CI with Atomist so that these tools are responsible for build. This has potential advantages in terms of scheduling and repeatability of environments.

Integrating a CI tool with Atomist is simple. Simply invoke Atomist hooks to send events around build and artifact creation.

If integrating CI tools, we recommend the following:

-   CI tools are great for building and generating artifacts. They are often abused as a PaaS for `bash`. If you find your CI usage has you programming in `bash` or YML, consider whether invoking such operations from Atomist event handlers might be a better model.
-   Use Atomist generators to create your CI files, and Atomist editors to keep them in synch, minimizing inconsistency.

#### Example: Integrating Travis

tbc

### Integrating APM tools

### Integrating with Static Analysis Tools

Any tool that runs on code, such as Checkstyle, can easily be integrated.

Use shell. node is good for this

### Integrations

### Choose a machine

You must set environment variables to choose a machine, if you override the default.

```
export MACHINE_PATH="./software-delivery-machine/machines"
export MACHINE_NAME="cloudFoundrySoftwareDeliveryMachine"
```

### Local HTTP server

To run a local HTTP server to invoke via `curl` or for smoke testing, please set the following environment variable:

```
export LOCAL_ATOMIST_ADMIN_PASSWORD="<value>"

```

#### Java

To build Java projects on the automation client node, you'll need:

-   JDK, for Maven and Checkstyle
-   Maven, with `mvn` on the path

#### Node

To build Node projects on the automation client node, you'll need:

-   `npm` - v 5.8.0 or above
-   `node`

#### Configuration

The following configuration should be in your `~/.atomist/client.config.json` in order to
successfully connect your SDM:

```json
{
  "token": "<your github token>",
  "teamIds": [
    "<your team id>"
  ],
  "sdm": {
    "rolar": {
      "url": "https://rolar.cfapps.io"
    },
    "graphviz": {
        "url": "<optional url to graphviz service>"
    },
    "cloudfoundry": {
      "api": "https://api.run.pivotal.io",
      "user": "<your Pivotal Cloud Foundry user name>",
      "password": "<your Pivotal Cloud Foundry password>",
      "org": "<your Pivotal Cloud Foundry organization name>",
      "spaces": {
        "production": "<your Pivotal Cloud Foundry production space name within your org>",
        "staging": "<your Pivotal Cloud Foundry staging space name within your org>"
      }
    },
    "checkstyle": {
      "enabled": false,
      "reviewOnlyChangedFiles": true,
      "path": "/Users/cdupuis/Development/atomist/sample-sdm/test/checkstyle-8.8-all.jar"
    }
  }
}
```

##### Checkstyle

Checkstyle is a style-checker for Java.
For the optional Checkstyle integration to work, set up two Checkstyle configuration as shown above.

Get `checkstyle-8.8-all.jar` from [Checkstyle's download page](https://sourceforge.net/projects/checkstyle/files/checkstyle/8.8/).

##### Cloud Foundry

This SDM allows deployment to Pivotal Cloud Foundry. For deployment to work you need to set your user,
password and org of your Cloud Foundry account. Additionally please configure two spaces to be used for
staging and production deployments.

##### Kubernetes

The kubernetesSoftwareDevelopmentMachine included here deploys to an Atomist sandbox kubernetes environment, using
[k8-automation](https://github.com/atomist/k8-automation) which we run inside our cluster. You can deploy the Spring Boot
projects created with `@atomist create spring` here, in order to try out the Kubernetes integration with the SDM.
