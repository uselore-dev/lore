#!/usr/bin/env node
import { main } from "../cli";

const code = await main(process.argv.slice(2));
process.exit(code);
