# Task-Mule

Yet another task runner for [NodeJS](https://nodejs.org/en/) .... why use [Grunt](http://gruntjs.com/) or [Gulp](http://gulpjs.com/) when you can write your own?

We have used both Grunt and Gulp. Gulp is a step up from Grunt. Actually Gulp is pretty good and we still use it for building web applications.

You must be proficient at JavaScript to make the most of this tool. 

NOTE: This documention is currently under construction. Please check back again soon for a completed version.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Why Task-Mule?](#why-task-mule)
- [Features](#features)
- [Use cases](#use-cases)
- [Getting started - ultra quick](#getting-started---ultra-quick)
- [Getting Started - the long version](#getting-started---the-long-version)
  - [Installing Task-Mule CLI](#installing-task-mule-cli)
  - [Create your first script](#create-your-first-script)
  - [Creating your first task](#creating-your-first-task)
  - [Running your task](#running-your-task)
  - [Installing npm dependencies](#installing-npm-dependencies)
  - [Configuration options](#configuration-options)
  - [Failing a task](#failing-a-task)
  - [Invoking a command](#invoking-a-command)
  - [Specifying task dependencies](#specifying-task-dependencies)
  - [Logging and validation](#logging-and-validation)
  - [Validation](#validation)
- [Advanced stuff](#advanced-stuff)
  - [Why promises?](#why-promises)
  - [Return values](#return-values)
  - [Converting callbacks to promises](#converting-callbacks-to-promises)
  - [*mule.js* layout](#mulejs-layout)
  - [Task-Mule file system structure](#task-mule-file-system-structure)
  - [Task layout](#task-layout)
  - [Task dependencies](#task-dependencies)
  - [Task execution order](#task-execution-order)
  - [Running dependencies manually](#running-dependencies-manually)
  - [More on running commands](#more-on-running-commands)
  - [Advanced configuration](#advanced-configuration)
  - [Task failure](#task-failure)
  - [Scheduled Tasks](#scheduled-tasks)
  - [Task validation](#task-validation)
  - [Invoking Task-Mule from code](#invoking-task-mule-from-code)
  - [Invoking Task-Mule from an automated test](#invoking-task-mule-from-an-automated-test)
  - [Custom initialisation code](#custom-initialisation-code)
  - [Bring your own logger](#bring-your-own-logger)
  - [Custom handling for task success/failure](#custom-handling-for-task-successfailure)
  - [Validation](#validation-1)
  - [Implementing command line documentation for your script](#implementing-command-line-documentation-for-your-script)
- [Future Plans](#future-plans)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Why Task-Mule?

So why Task-Mule? Task-Mule is a bit different. It is a task runner of course, but is not just for build scripts. It was designed for large automation jobs with complex dependencies between tasks.

Task-Mule was built for piece-meal testing of individual tasks. Each task can be tested from the command line (or test runner) with ease, even if those tasks will only ever be a dependency for other tasks in production.

Task-Mule tasks can also easily be tested via tools like Mocha. More on that later.

Task-Mule relies on [npm](https://www.npmjs.com/). Install the dependencies you need via npm and then wire them into your script through tasks written in JavaScript.

## Features

- Both procedural and config driven scripts. Create your tasks in code, provide options via configuration.
- Run a task and all its dependencies.
- Scheduled task running.
- Install dependencies via npm. 
- Basic logging, can also add your own.
- Configuration management (via [Confucious](https://github.com/real-serious-games/confucious)).
- Built-in support for running command line tools and retreiving their output.
- Promises are used for async tasks.

## Use cases

We use Task-Mule for:

- Our Unity build script;
- Server deployment (see [basic example](https://github.com/ashleydavis/NodeJS-Skeleton) on github);
- Scheduling automated tasks (eg for scraping data).

We'll have more examples online in the future.

## Getting started - ultra quick

If you already have NodeJS and are familiar with npm, here is the expigated guide to getting started. If you need more explanation please skip to the following section.

Install task-mule-cli, only need to do this once:

	npm install -g task-mule-cli

Install task-mule locally for each automation script:

	npm install --save task-mule

Create your script:

	task-mule init

Create a task:

	task-mule create-task my-first-task

Edit *tasks/my-first-task.js* so that it does what you want.

Run the task:

	task-mule my-first-task
   
## Getting Started - the long version

### Installing Task-Mule CLI

First up, make sure you have Node.js installed:	[https://nodejs.org/en/](https://nodejs.org/en/) 

Now open a command line and npm install the Task-Mule CLI:

	npm install -g task-mule-cli

*task-mule-cli* is a very simple global command for Task-Mule that delegates to the locally installed version of Task-Mule (this allows you to have different versions of Task-Mule installed for different scripts).

### Create your first script

Now create a directory for your new script (assume we are making a build script) and change into it:

	md my-build-script
	cd my-build-script

Initialise npm and create *package.json* to track the packages for your build script:

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

You should now see an error message saying *'mule.js' not found*. mule.js is the entry point for a Task-Mule script, similar to *Gruntfile* (for Grunt) or *gulpfile.js* (for Gulp).

Generate a default *mule.js* as follows:

	task-mule init

This creates a template *mule.js* that you can fill out. You don't actually have to put anything in this file, but you may want to have custom initialisation or clean up code, or override the logging system or provide custom handling for task failure. 

### Creating your first task

Run task-mule now:

	task-mule

You'll see an error message that indicates you have no *tasks* directory. Each Task-Mule *task* lives in its own file under the *tasks* directory.

Run the following command to create the *tasks* directory and your first task:

	task-mule create-task my-first-task

This has created the *tasks* directory and created the file *my-first-task.js*. Open this file and you'll see a template for the basic [layout of a task](#task-layout).

Let's add a simple log message so we can see it running. Find the invoke function and in the function body add:

	log.info("Hello computer!");

### Running your task

Again from the command line, making sure you are in the correct directory for your automation script, run the task you created in the previous section:

	task-mule my-first-task

That's it. You should see the output *Hello computer!*.

### Installing npm dependencies

Let's get this doing something useful. Say you want to run a command on a remote machine via SSH. This kind of thing is useful when you use Task-Mule for server deployment.

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

Note that we simply return the promise for the invoke function. Task-Mule uses promises for async tasks. When Task-Mule has multiple tasks to invoke it uses promises to chain them one after the other.

### Configuration options

The previous example can be improved by wiring in external configuration.

Let's see what that looks like:

	module.exports = function (log, validate) {
	    
		var SshClient = require('ssh-promise');

	    return {
	        
	        // ... other task fields ...
	        
	        invoke: function (config) {
	            
				var sshConfig = {
					host: config.get('host'),
					username: config.get('username'),
					password: config.get('password'),
				};

				var ssh = new SshClient(sshConfig);
				return ssh.exec('... some script to run on remote machine ...');
	        },
	    };
	};

In this example we are calling `config.get` to pull some external configuration into our task. 

How do we specify this configuration? We have multiple options. 

One is the command line:

	task-mule my-first-task --host=somehost --username=myusername --password=thepassword

This makes it easy to test tasks from the command line.

More permanently though we can store configuration in *config.json* or set defaults in *mule.js*. We can also specific configuration through *environment variables*. More on configuration in the advanced section...

### Failing a task

Tasks are failed in one of two ways. Either return a *rejected* promise or throw an exception (which ultimately results in a rejected promise).

First example:

	module.exports = function (log, validate) {

	    return {
	        
	        invoke: function (config) {

				var someRejectedPromise = ... promise is rejected for some reason ...
	            
				return someRejectedPromise;
	        },
	    };
	};
 
Second example:

	module.exports = function (log, validate) {

	    return {
	        
	        invoke: function (config) {

				throw new Error("This task will always fail");
	        },
	    };
	};

### Invoking a command

Task-Mule includes a special global helper function `runCmd` to help you run system commands and marshal the results back into the build script. 

In this example we'll run the command `hg id --num` which determines the current revision number of the [*Mercurial*](https://en.wikipedia.org/wiki/Mercurial) [repository](https://en.wikipedia.org/wiki/Repository_(version_control)) we happen to be. This kind of thing is useful in build scripts because you often want to *stamp* the number of the current code revision into the build somehow. 

	module.exports = function (log, validate) {

	    return {
	        
	        invoke: function (config) {

				var cmd = 'hg';
				var args = ['id', '--num'];

				return runCmd(cmd, args)
					.then(function (cmdResult) {
						var versionNo = parseInt(cmdResult.stdOut.trim());
						config.set('version', versionNo); 
					});
	        },
	    };
	};

This example parses the output from the `hg` command and sets it into the configuration for use by dependent tasks. 	

More on running commands in the advanced section...

### Specifying task dependencies

Ok... so a single task won't get us very far. Let's build on the previous example and make use of the revison number we now have in our configuration. Assume the task in the previous example is in a file under the *tasks* directory called *determine-revision-number.js*.

We can make a dependent task (let's called it *gen-build-info.js*) as follows:

	module.exports = function (log, validate) {

		var fs = require('fs');

	    return {

			dependsOns: [
				"determine-revision-number",	
			],
	        
	        invoke: function (config) {

				var versionNo = config.get('version');

				var fileToOutput = 
					"public static class BuildInfo\r\n" +
					"{\r\n" +
					"    public static int VersionNo = " + versionNo + "\r\n" +
					"}";

				fs.writeFileSync("BuildInfo.cs", fileToOutput); 
	        },
	    };
	};

This example task is synthesizing a code file with a variable that is set to the current revision number of the repository. We do this kind of thing before the [code build](https://en.wikipedia.org/wiki/Software_build) step to *bake* the version number into our executable so that we can always indentify which code revision the build came from. 

Note that in this example we aren't returning a promise. Because the task is synchronous rather than asynchronous (due to our choice of using `readFileSync`) we don't need to return a promise. Task-Mule will just assume that this task was synchronous and that the operation has completed immediately. 

Note that a task is automatically failed when it's downstream dependencies fail. This means that if *determine-revision-number* fails, it's dependent task *gen-build-info* will also fail.   

For more on task return values, order of execution and task failure, please see the advanced section.

### Logging and validation

Every task is passed the default basic logger as a parameter:

	module.exports = function (log, validate) {

		... task implementation ...

	};

The default logger has the following functions:

	log.info(... msg ...)
	log.verbose(... msg ...)
	log.warn(... msg ...)
	log.error(... msg ...)
	
Calling the log functions has no impact on task failure, they are purely for providing feedback to the user. What I'm saying is that calling `log.error` doesn't automatically fail the task, you still have to throw an exception or return a rejected promise, but it's also a good idea to *log an error* so the user has more information about *why* the task failed.

See the advanced section if you want to *bring your own logger*.

### Validation

Tasks also have a `validate` parameter that provides a number of convenience functions for validation of configuration and system state. To validate input to your task you should implemented the task's `validate` function.

As an example let's check that the correct configuration is present for the earlier ssh example: 

	module.exports = function (log, validate) {

	    return {

			validate: function (config) {
				validate.config('host', config);
				validate.config('username', config);
				validate.config('password', config);
			},
	        
	        invoke: function (config) {

				... run the task ... 
	        },
	    };
	};

This simply checks that the configuration expected for the ssh task is present and if not validation and therefore the task is failed.

There are various other validation functions available, please see the advanced section for more details.

## Advanced stuff

### Why promises?

Let's get this out of the way first: Why does Task-Mule rely on promises?

Promises a great way of managing and simplifying async operations. I wanted to keeps things simple for Task-Mule, supporting both callbacks and promises would have added extra complexity to Task-Mule and subsequently this documentation.

I'm sorry, If you don't like promises, this tool isn't for you.

### Return values

All of the functions in *mule.js* and the tasks can return promises, this allows Task-Mule to support asynchronous operations and to properly sequence tasks one after the other.

You can also perform syncrhonous operations in a task and return nothing from the task. 

What you can't do is perform a non-promise-based asynchronous operation and have Task-Mule respect that. If you do this then you do it outside the knowledge of Task-Mule and any dependent tasks will most-likely be invoked before the operation has completed.

When you need to use your typical Node.js functions that invoke a callback you can easily convert them to promises...

### Converting callbacks to promises

Let's look at an example of converting a Node.js callback-based function to a promise.

Here's an example of loading a file asynchronously:

	var fs = require('fs');

	var fileName = ...

	fs.readFile(fileName, 'utf8', function (err, fileContent) {
		if (err) {
			// ... handle the error ...
			return;
		}

		// ... file was loaded successfully ... 
	});

Of course get into trouble when we try to chain multiple asyncronous operations. 

	var fileName1 = ...
	var fileName2 = ...

	fs.readFile(fileName1, 'utf8', function (err, fileContent1) {
		if (err) {
			// ... handle the error ...
			return;
		}

		fs.readFile(fileName2, 'utf8', function (err, fileContent2) {
			if (err) {
				// ... handle the error ...
				return;
			}
	
			// ... both files were loaded successfully ... 
		});
	});


This are heading towards *callback hell*. Promises solves this nicely by allowing us to unwind the nesting and chain asynchronous operations. For example, *if* the `readFile` function returned a promise instead of invoking a callback we could rewrite the previous example as follows:
 
	fs.readFile(fileName1, 'utf8')
		.then(function (fileContent1) {
			return fs.readFile(fileName2, 'utf8');
		}) 
		.then(function (fileContent2) {
			// ... both files were loaded successfully ...			
		})
		.catch(function (err) {
			// ... handle the error ...
		});		

The promises example is easier to read and understand. Unfortunately Node.js functions don't return promises, so we must wrap them manually. This is easy to achive:

	var readFilePromise = function (fileName) {
		return new Promise(function (resolve, reject) {
			fs.readFile(fileName, 'utf8', function (err, fileContent) {
				if (err) {
					reject(err);
					return;
				}

				resolve(fileContent);
			});
		});
	}

When we call `readFilePromise` we get back a promise that will be *resolved* with the file contents if the file was loaded successfully, otherwise it will be *rejected* with the error that ocurred.

Now let's rewrite the previous example with our new helper function:

	readFilePromise(fileName1)
		.then(function (fileContent1) {
			return readFilePromise(fileName2);
		}) 
		.then(function (fileContent2) {
			// ... both files were loaded successfully ...			
		})
		.catch(function (err) {
			// ... handle the error ...
		});		

Of course you could just use one of the many *promisify* librarys that do convert callback functions to promise functions for you. For example, *[promisify-node](https://www.npmjs.com/package/promisify-node)* allows you to convert all the fs functions at once, then you you really can just treat node functions as though they return promises:

	var promisify = require("promisify-node");
	var fs = promisify("fs");

	fs.readFile(fileName1, 'utf8')
		.then(function (fileContent1) {
			return fs.readFile(fileName2, 'utf8');
		}) 
		.then(function (fileContent2) {
			// ... both files were loaded successfully ...			
		})
		.catch(function (err) {
			// ... handle the error ...
		});		

Let's look at a Task-Mule task that asynchronously loads a text file and stores it in config:

**Note:** this is a complete example, but you can make things easier for yourself by making a helper function or using *promisify* as described above.

	module.exports = function (log, validate) {

		var fs = require('fs');

	    return {

	        invoke: function (config) {

				return new Promise(function (resolve, reject) {
					fs.readFile('SomeImportantFile.txt', 'utf8', 
						function (err, fileContent) {
							if (err) {
								reject(err);
								return;
							}

							config.set('SomeImportantFile', fileContent);
						}
					);
				});
	        },
	    };
	};

### *mule.js* layout

*mule.js* is the Task-Mule automation script entry point. It is similar to *Gruntfile* or *Gulp.js* in *Grunt* and *Gulp*.

You can create a new *mule.js* from the template by running the following commmand in the directory for your script:

	task-mule init

Technically it's not necessary to modify *mule.js* in any way to create and run tasks. You can just simply create and edits *task* files in the *tasks* directory and then run those tasks using the following command:

	task-mule <some-task-name>

However if you want to make custom initialisation, event handling or more, you'll need to edit *mule.js*.

Creating a new *mule.js* will give you the following template, which has stubs for you to fill out and comments for explanation:
	
	module.exports = function (config, validate) {
	
		// ... load npm modules here ...
	
		return {
			//
			// Describes options to the system.
			// Fill this out to provide custom help when 'task-mule --help' 
			// is executed on the command line.
			//
			options: [
				['--some-option', 'description of the option'],
			],
	
			//
			// Examples of use.
			// Fill this out to provide custom help when 'task-mule --help' 
			// is executed on the command line.
			//
			examples: [
				['What it is', 'example command line'],
			],
	
			/* Uncomment this to provide your own custom logger.
	
			initLog: function () {
	
				var myLogger = {
					verbose: function (msg) {
						console.log(msg);					
					},
	
					info: function (msg) {
						console.log(msg);					
					},
	
					warn: function (msg) {
						console.log(msg);
		
					},
	
					error: function (msg) {
						console.error(msg);
					},
				}
	
				return myLogger;
			},
			*/
	
			initConfig: function () {
				// ... setup default config here ...
			},
	
			init: function () {
				// ... custom initialisation code here ... 
			},
	
			unhandledException: function (err) {
				// ... callback for unhandled exceptions thrown by your tasks ...
			},
	
			taskStarted: function (taskInfo) {
				// ... callback for when a task has started (not called for dependencies) ...
			},
	
			taskSuccess: function (taskInfo) {
				// ... callback for when a task has succeeed (not called for dependencies) ...
			},
	
			taskFailure: function (taskInfo) {
				// ... callback for when a task has failed (not called for dependencies) ...
			},
	
			taskDone: function (taskInfo) {
				// ... callback for when a task has completed, either failed or succeeed (not called for dependencies) ...
			},
	
		};
	};


### Task-Mule file system structure

A Task-Mule automation script is structured in the file system as follows.

	my-script/
		node-modules/
			task-mule/					-> Local version of Task-Mule 
			... other npm packages ...	   (this allows different scripts to use different versions).
		mule.js							-> Task mule entry point.
		tasks/							-> Directory that contains the tasks.
			task1.js					-> Each task lives in it's own file 
			task2.js					   and is named after that file.
			subdir/
				nested-task.js			-> Tasks can even be nested under sub-directories
										   to help group and organise your tasks.
		some-other-file.js				-> Include any other JavaScript files and require
										   them into your script.

### Task layout

Run the following command to create a new task with the default layout:

	task-mule create-task <new-task-name>

This creates a new task file in the tasks directory with the following name: <new-task-name>.js.

Here is the default task layout for your enjoyment: 

	module.exports = function (log, validate) {
	    
	    return {
	        
	        description: "<description of your task>",
	        
	        // Tasks that this one depends on (these tasks will run before this one).
	        dependsOn: [
				// ... list of dependencies ...
			], 
	
	        //
	        // Validate configuration for the task.
	        // Throw an exception to fail the build.
	        //
	        validate: function (config) {
	            // ... validate input to the task ...
	        },
	
	        //
	        // Configure prior to invoke dependencies for this task.
	        //
	        configure: function (config) {
	            // ... modify configuration prior to invoking dependencies ...
	        },
	        
	        //
	        // Invoke the task. Peform the operations required of the task.
	        // Return a promise for async tasks.
	        // Throw an exception or return a rejected promise to fail the task.
	        //
	        invoke: function (config) {
	            // ... do the action of the task ...
	
	            // ... return a promise for asynchronous tasks ...
	        },
	    };
	};

### Task dependencies

There are several ways to specify the dependencies for a task.

The simplest one, that we have already seen, is just an array of task names:

	dependsOn: [
		"dependency-task-1",
		"dependency-task-2",
		"and-so-on",
	],

You can also use a function to dynamically generate the dependency list:

	dependsOn: function (config) {
		return [
			"dependency-task-1",
			"dependency-task-2",
			"and-so-on",
		];
	},

Or:

	dependsOn: function (config) {
		var deps = [];
		deps.push("dependency-task-1");
		deps.push("dependency-task-2");
		deps.push("and-so-on");
		return deps;
	},

This can be used in many interesting ways, for example conditionally building a dependency list based on configuration. 

For example, we conditionally enable a *clean build* something like this:

	dependsOn: function (config) {
		var isCleanBuild = config.get('clean');
		
		var deps = [];
		if (isCleanBuild) {
			// Only delete previous buid output when the 'clean' option is used. 
			deps.push("delete-the-build-output");
		}

		deps.push("build-the-code");
		return deps;
	},

This kind of thing allows you to conditionally modify dependencies via the command line, the *clean* option for example is used like this:

	task-mule do-the-build --clean

The `dependsOn` function, like all Task-Mule callbacks, can return a promise when you need to run an asynchronous operation. The promise should be *resolved* to a list of task names. 

	dependsOn: function (config) {
		
		var promise = ... some async operation ...

		return promise;
	};

As a contrived example, let's say you want to load your dependencies from a MongoDB database using [promised-mongo](https://www.npmjs.com/package/promised-mongo):

	var db = ... initalise a promised-mongo db ....

	dependsOn: function (config) {

		var someDbQuery = ...		
		return db.myCollection.find(someDbQuery).toArray()
			.then(function (dbDocuments) {
				return dbDocuments.map(function (document) {
					return document.taskName;
				});			
			});
	};
	 
Crazy yes. Why would you want to load your dependencies from a database? I have no idea it's your automation script. Maybe I'll include a real example one day.

When the `dependsOn` function throws an exception or returns a `rejected` promise the task is failed. 

### Task execution order

When a task is requested to be executed, either from the command line or as a dependency of some other task, it's dependencies will run first in the order specified by the task's `dependsOn` function.

For example, consider *task-A*:

	module.exports = function (log, validate) {
	    
	    return {
	        
	        dependsOn: [
				"dependency1",
				"dependency2",
			], 
	
	        invoke: function (config) {
	            // ... do the action of the task ...
	        },
	    };
	};
 
The order of tasks invoked is as follows:

1. dependency1
2. dependency2
3. task-A

When dependencies have sub-dependencies, the sub-dependencies are run in the order specified before the dependency is executed.

For example, say *dependency1* from the previous example has dependencies *sub-dependency1* and *sub-dependency-2* and *dependency2* has *sub-dependency3* and *sub-dependency-4*, then the order of task is as follows:

1. sub-dependency1
2. sub-dependency2
3. dependency1
4. sub-dependency3
5. sub-dependency4
6. dependency2
7. task-A

What is being done here is a *[depth-first post-order traversal](https://en.wikipedia.org/wiki/Tree_traversal#Depth-first_search)* of the task tree, executing each task as each node in the tree is visited.

### Task failure

Failure of a task is triggered by any of the following events that occur in any of the task's functions:

- An exception is thrown;
- The returned promise is rejected; or
- An unhandled exception occurs while a task is running.

When a task fails all further processing by the task is aborted. In addition execution of subsequent tasks are are also aborted. We can say that task failure *short-circuits* out of the sequence of tasks.

Consider the example sequence of tasks from the previous section. Let's say *sub-dependency3* fails. None of the tasks after *sub-dependency3* will run in this case:

1. (**success**) sub-dependency1
2. (**success**) sub-dependency2
3. (**success**) dependency1
4. (**fails and aborts**) sub-dependency3
5. (**never runs**) sub-dependency4
6. (**never runs**) dependency2
7. (**never runs**) task-A

Note the tasks that have already run, that is everything before *sub-dependency3* have already run and so are not effected by the failure of *sub-dependency3*.

### Task validation

Tasks are validated via the `validate` function.

	module.exports = function (log, validate) {
	    
	    return {
	        
	        validate: function (config) {
	            // ... validate input to the task ...

				//
				// To fail the task: throw an exception or return a rejected promise.
				//
	        },
	
	        invoke: function (config) {
	            // ... do the action of the task ...
	        },
	    };
	};

Like other other task functions `validate` can return a promise if validation needs to be asynchronous.

To fail a task throw an exception or return a *rejected* promise. 

Validation for a sequence of tasks is run before any of the tasks are *invoked*. This allows the entire automation script to quickly check that it's configuration and inputs are correct before it does any work. The reason for this is to have quick feedback. No one likes to have to wait for a significant amount of time (say while a build is running) before the script fails due to a configuration or input error. So validation runs first for all tasks that will be invoked. This ensure the script will fail fast when there is a user error.

If you have some validation that is dependent on input from previous tasks in the sequence, say tasks that add their output to the configuration, you should perform validation on configuration that is generated in the *invoke* function. 

The task is passed the *validate* parameter, this has some convenient helper functions for validation:

- `var value = validate.config(<config>, <config-name>)` - Verify that a specified named value exists in the configuration. This also returns the value, which you can use for further validation. Fails the task if the requested value does not exist. 
- `validate.directoryExists(<path>)` - Verify that a directory already exists. Fails the task if that directory doesn't exist.
- `validate.fileExists(<path>)` - Verify that a file already exists. Fails the task if that file doesn't exist.

### Running dependencies manually

Dependencies are normally specified via the *dependsOn* field of the task. You can also invoke dependencies manually. You might want to do this to have more control. 

To make use of this use the `taskRunner` that is passed to the task module:

	module.exports = function (log, validate, taskRunner) {
	    
	    return {
	        
	        invoke: function (config) {

				var configOverrides = {
					//... Override config values ... 
				}
	            
				// Manually invoke a dependency.
				return taskRunner.runTask('my-dependency', config, configOverrides)
					.then(function () {
						// Dependency completed successfully...

						// ... now do the action of this task ...
					});				
	        },
	    };
	};

`runTask` returns a promise. Use `catch` to handle errors manually or discard them entirely:

	module.exports = function (log, validate, taskRunner) {
	    
	    return {
	        
	        invoke: function (config) {

				var configOverrides = {
					//... Override config values ... 
				};
	            
				// Manually invoke a dependency.
				return taskRunner.runTask('my-dependency', config, configOverrides)
					.then(function () {
						// ... now do the action of this task ...
					})
					.catch(function (err) {
						// ... handle the failure of the dependency however you want ...
					});
	        },
	    };
	};


### More on running commands

Use `runCmd` to invoke a command, executable or batch file. An example is presented earlier in this documentation. `runCmd` returns a promise, so it works well with Task-Mule tasks.

`runCmd` is simply for convenience. It is built on the Node.js `spawn` function and is setup to redirect standard output and standard error to Task-Mule output. This output is only displayed either when the *--verbose* command line option is used or when an error occurs.  

The promise returned by `runCmd` is resolved when the process being run has finished. By default the promise is rejected if the process completes with an error code. You can set the `dontFailOnError` option to true if the promise should be resolved even if the process fails:

	var options = { 
		dontFailOnError: true 
	};
	runCmd('something-that-might-fail', args, options);

The other options that are passed to `runCmd` are also passed to `spawn`, so `runCmd` accepts all the same options as `spawn`.

You don't have to use `runCmd`. Feel free to [Node.js process functions](https://nodejs.org/api/child_process.html) directly or whatever other functions will do the job for you. Just remember that you will need to *promisify* any asynchronous operations.

### Advanced configuration

Task-Mule relies on [Confucious](https://www.npmjs.com/package/confucious) for managing it's configuration. This gives you much flexibility in how you configure Task-Mule.

By default Task-Mule automatically wires in environment variables and command line parameters. You can set configuration options in *mule.js*. You can put configuration options in *config.json*. You can set global configuration options from tasks. You can also *override* the configuration for manually invoked tasks. 

This is the hierarchy of configuration options:

- Global options.
- Environment variables.
- *Config.json*
- Configuration setup in *mule.json* `initConfig`.
- Command line options.
- Configuration setup in *mule.json* `init`.
- Configuration set while running tasks.
- Configuration overrides for specific tasks.

Let's look at some examples.

Say you have an environment variable set. You can do this in a Windows shell as follows:

	set my_option=5

Now you can read this option in a task:

	var myOption = config.get('my_option');

You can set a default for this option in *mule.js* `initConfig`:

	initConfig: function () {
		
		var defaultConfig = {
			my_option: 10
		};
		config.push(defaultConfig);
	}	

The default can be overriden in *config.json*:

	{
		"my_option": 10
	}

You can also override from the command line:

	task-mule my-task --my_option=12

Dependency tasks have their own private configuration space. This is achieved by using Confucious to push a new entry on the configuration stack for each dependent task. That private space is wiped out when the dependency task has completed. This means that any tasks that use `config.set` to set a configuration variables will have those variables wiped out. Tasks that want to use configuration to communicate to other tasks must use *config.setGlobal*. This will change configuration values at the bottom level of the configuration stack. This should be used with care! You might wipe out configuration that is needed by other tasks! Also globals are overriden by every other level of the stack! So you may not get the behaviour you hoped.

Dependent tasks can communicate private configuration to dependency tasks using *configuration overrides*.

When running tasks manually (full example shown earlier) you can override configuration just for a single task instance:

	var configOverrides = {
		my_option: 42 
	};
    
	return taskRunner.runTask('my-task', config, configOverrides)
		.then(function () {
			// ... dependency task complete ...
		})
		.catch(function (err) {
			// ... handle the failure ...
		});

By running tasks manually and using config overrides you can easily invoke a single task many times with different configuration each time.

For example you might have a task that provision virtual machines. Let's call that task *provision-vm*. Part of it's config is the name of the VM to provision, etc. Then define another task, for example, called *provision-vms*. This task can invoke *provision-vm* for as many VMs as you need, each with it's on custom configuration.

### Scheduled Tasks


### Invoking Task-Mule from code

### Invoking Task-Mule from an automated test

### Custom initialisation code

### Bring your own logger

todo: Give an example using structured-log to output your task results to a database.

### Custom handling for task success/failure

### Validation

### Implementing command line documentation for your script

todo: This is kind of like reflection. Documenting your script and tasks so that users can query it from the command line to work out what it can do and how to use it.
Really need to be able to query an individual task for what it does.

### Testing tasks from the command line

### Testing tasks from Mocha

## Future Plans

- Direct support for Gulp plugins in Task-Mule.
- Install complete Task-Mule tasks directly from npm.
- More advanced ways of passing configuration between tasks.
- Pipelines of tasks where one task feeds data into the next.
