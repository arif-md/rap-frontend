# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Docker : Build, run and upload image to ACR

To build and test the container image run:

```bash
docker build -t frontend .
docker run -itd -p 4200:80 frontend OR docker run -p 4200:80 frontend
docker tag frontend:latest ngraptortest.azurecr.io/raptor/frontend
docker images
docker push ngraptortest.azurecr.io/raptor/frontend
```

The above commands will build and run the image so that it can be tested locally @ http://localhost:4200
Please make sure to start the Docker desktop before executing the above commands. 
Use the following commands to upload the image to ACR.

```bash
az login
az acr login --name ngraptortest
docker push ngraptortest.azurecr.io/raptor/frontend
az acr repository list --name ngraptortest --output table
```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
