# Example Client-Server WebApp With Key Backup Using the Sodot MPC SDK

This is a minimal example project the showcases one way you can leverage the Sodot MPC SDK to create distributed private keys for both ECDSA (on secp256k1) and Ed25591 signature algorithms, and threshold signing using MPC, as well as simulating a key backup and recovery process for ease of use.

More information on the Sodot MPC SDK can be found in Sodot's [technical docs](https://docs.sodot.dev/docs/intro).

## Accessing the Demo

### Online Demo

This demo can be accessed [online](https://backupdemo.sodot.dev) without any necessary configuration!

### Running the Project Locally

First, you will need an `API_KEY` and an `NPM_TOKEN`. This can be requested from the [Sodot team](mailto:sdk@sodot.dev).
Add your `NPM_TOKEN` to your environment variables and use it to install the dependencies.

```bash
export NPM_TOKEN="<YOUR_NPM_TOKEN>"
```

For the API key, create a file in the root directory of this repo named `.env` and add the following:

```bash
API_KEY=<YOUR_API_KEY>
```

Then, you can use `npm run dev` in order to open the development server on your local machine.

You can also use the provided [dockerfile](./dockerfile) in order to run the project locally without any installations.

```bash
docker build --build-arg NPM_TOKEN=<YOUR NPM TOKEN> --build-arg API_KEY=<YOUR API KEY> -t sodot-demo .
docker run -p 4173:4173 --name sodot-demo sodot-demo
```

## User Flow

There are two main flows in this project:

- **New Wallet**
  1. The user chooses their backup method, where the key will be saved for future retrieval.
  1. A key is generated and the user gets one share which is stored using their chosen backup method. The server also saves its own share (more on that below).
  1. The current wallet info is presented to the user, and they can now sign various messages using MPC.
- **Recover Existing Wallet**
  1. The user chooses where their backup is, the key is then retrieved and is ready to be used.
  1. Same as the New Wallet flow - the info is shown and the user can now sign messages.

> NOTE: this demo server doesn't use a persistent database to store its secret shares. Instead, all the server keys are stored for a duration of several minutes in memory before being cleaned. If you attempt to recover your key when the server already dropped its own share, a pop-up message will prompt you to regenerate a new key.

## Project Structure

This project uses [SvelteKit](https://kit.svelte.dev/) for a unified front-end and back-end codebase. The interesting parts are the **backup handling** code, as well as the **MPC** usage, done by the Sodot MPC SDK.

- Handling the backup and recovery of keys is handled by the [`backup` components](./src/lib/components/backup) directory and the [`cloud` store](./src/lib/stores/cloud.ts).
- The code handling the Sodot MPC SDK can be found in two places:
  - For the client - under the [`mpc` components](./src/lib/components/mpc) directory. These components use the `@sodot/sodot-web-sdk-demo` package, which contains bindings for the browser.
  - For the server - under the various [`api` routes](./src/routes/api) that allow the user and the server to communicate. These components use the `@sodot/sodot-node-sdk-demo` package, which contains bindings for node.
- The rest of the code is mainly for handling the UI and navigation.
