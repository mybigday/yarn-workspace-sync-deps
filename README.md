# yarn-workspace-sync-deps

> A simple script for keeping dependencies are same between root and packages on
> Yarn workspaces.

## What?

We are using Yarn workspaces and enabled [Greenkeeper](https://greenkeeper.io),
but Greenkeeper currently doesn't check for `packages/*`. We gave up the
independent dependencies in `packages/*`, make the dependencies same as root
dependencies.

You still need update the dependencies of `packages/*` on local, but it will be
helpful for CI and Greenkeeper.

## Installation

In the root workspace:

```bash
$ yarn add --dev -W yarn-workspace-sync-deps
```

## Usage

We are using it after yarn install in the root workspace:

```json
{
  "scripts": {
    "postinstall": "yarnw-sync-deps && yarn --ignore-scripts"
  }
}
```

## License

[MIT](LICENSE.md)
