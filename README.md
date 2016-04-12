# Task-Mule

Yet another task runner for [NodeJS](https://nodejs.org/en/) .... why use [Grunt](http://gruntjs.com/) or [Gulp](http://gulpjs.com/) when you can write your own?

We have used both Grunt and Gulp. Gulp is a step up from Grunt. Actually Gulp is pretty good and we still use it for building web applications. 

## Why Task-Mule?

So why Task-Mule? Task-Mule is a bit different. It is a task runner of course, but it is not just for build scripts. It was designed for large automation jobs with complex dependencies between tasks.

Task-Mule was built for piece-meal testing of individual tasks. Each task can be tested with ease, even if those tasks will only ever be a dependency for other tasks in production.

Task-Mule relies on [npm](https://www.npmjs.com/). Install the dependencies you need via npm and then wire them into your script through tasks.

## Features

- Basic logging, you can also add your own.
- Configuration management (via [Confucious](https://github.com/real-serious-games/confucious)).
- Run a task and all its dependencies.
- Scheduled task running.
- Built-in support for running command line tools and retreiving their output.
- Install dependencies via npm. 
- Promises are used for async tasks.

## Use cases

todo: Unity build script, server deployment, scheduling automated tasks (eg Investment Tracker).  

## Installing Task-Mule CLI

Firstly you need to npm install the Task-Mule CLI:

	npm install -g task-mule-cli

This is a very simple global command for Task-Mule that delegates the work to whatever local version of Task-Mule you have installed.

## Create your first script

Now create a directory for your new script (assume we are making a build script) and change into it:

	md my-build-script
	cd my-build-script

Initialise npm and create *package.json* to track your packages:

	npm init

Now trying running task-mule:

	task-mule

You should see an error message saying that you must have a local version of Task-mule installed.

Now go ahead and install the local version of Task-Mule:

	npm install --save task-mule

You can look at the contents of *package.json* to check that it has saved the Task-Mule dependency correctly:

	cat package.json

The output should show the local version of Task-Mule that is installed, something like:

	"dependencies": {           
	  "task-mule": "^1.4.16"    
	},                           

Now try running task-mule again: 

	task-mule

You should now see an error message saying *'mule.js' not found*. mule.js is the entry point for a Task-Mule script, similar to the *Gruntfile* (for Grunt) or *gulpfile.js* (for Gulp).

Generate a default mule.js as follows:

	task-mule init

This creates a template *mule.js* for you.

## Creating your first task

If you run task-mule now:

	task-mule

You'll see an error message that indicates you have no *tasks* directory.

Run the following command to create your first task:

	task-mule create-task my-first-task

This has created the *tasks* directory and created the file *my-first-task.js*. Open this file and you'll see a template for the basic [layout of a task](#task-layout).

Let's add simple so we can see it running. Find the invoke function and in the function body add:

	log.info("Hello computer!");

## Running your task

To run the task you created in the previous section:

	task-mule my-first-task

That's it. You should see the output *Hello computer!*.

## Installing npm dependencies

Let's get this doing something useful. Say you want to run a command on a remote machine via SSH. This kind of thing is useful when you use Task-Mule as a deployment script for cloud servers.

Let's install *[ssh-promise](https://www.npmjs.com/package/ssh-promise)* from npm.

	npm install --save ssh-promise 
 
Now we can add SSH commands to our task:

	module.exports = function (log, validate) {
	    
		var SshClient = require('ssh-promise');

	    return {
	        
	        // ... other task fields ...
	        
	        invoke: function (config) {
	            
				var sshConfig = {
					host: ...,
					username: ...,
					password: ...,
				};

				var ssh = new SshClient(sshConfig);
				return ssh.exec('... some script to run on remote machine ...');
	        },
	    };
	};

Note that we simply return the promise for the task. Task-Mule uses promises for async tasks. When Task-Mule has multiple tasks to invoke it uses promises to chain them one after the other.

## Configuration options

todo: can improve previous example with configuration.

## Specifying task dependencies

## Scheduled Tasks

## *mule.js* layout

## Tasks file system structure

## Task layout

## Task validation

## Future Plans

Support for Gulp plugins in Task-Mule.