# Machinomy contracts [![Build Status][travis-img]][travis] [![Coverage Status][coveralls-img]][coveralls]
[travis]: https://travis-ci.org/machinomy/machinomy-contracts
[travis-img]: https://img.shields.io/travis/machinomy/machinomy-contracts.svg
[coveralls]: https://coveralls.io/github/machinomy/machinomy-contracts?branch=master
[coveralls-img]: https://coveralls.io/repos/github/machinomy/machinomy-contracts/badge.svg?branch=master

Machinomy contracts is a TypeScript interface for Ethereum contracts managed by [Truffle](https://github.com/trufflesuite/truffle) used by [Machinomy](https://github.com/machinomy/machinomy).

## Install
```
$ yarn add @machinomy/contracts
```

## Workflow
Use [ganache-cli](https://github.com/trufflesuite/ganache-cli) for fast development. Start it:
```
$ ganache-cli
```

Then deploy contracts to the tesrpc network:
```
$ yarn truffle:migrate
```

Truffle generates json files by default. You need to compile the json files to ts files. Run:
```
$ yarn build
```
Now package is ready to use by Machinony.

## Deployment
To deploy the package to the Ropsten network you need to run local geth instance and then run commands:
```
$ yarn truffle:migrate --network ropsten
$ yarn build
```
