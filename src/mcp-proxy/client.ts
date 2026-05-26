/**
 * Copyright (C) 2024 quarterstar (quarterstar@proton.me)
 * Licensed under the GNU AGPL v3.0
 * See LICENSE file for details
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import yaml from 'yaml';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

interface McpConfig {
  roots?: string[];
}

function loadRootsFromConfig() {
  const configHome =
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  const configPath = path.join(configHome, 'mcp', 'mcpm.yml');

  try {
    if (!fs.existsSync(configPath)) {
      console.warn(`Config not found at ${configPath}.`);
      return [];
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const parsedYaml = yaml.parse(fileContent) as McpConfig;

    if (!parsedYaml?.roots || !Array.isArray(parsedYaml.roots)) {
      return [];
    }

    return parsedYaml.roots.map(rootPath => {
      const expandedPath = rootPath.replace(/^~(?=$|\/|\\)/, os.homedir());
      const absolutePath = path.resolve(expandedPath);

      return {
        uri: pathToFileURL(absolutePath).href,
        name: path.basename(absolutePath) || 'Root Directory',
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error reading config file: ${message}`);
    return [];
  }
}

export async function createMcpClient(name: string): Promise<Client> {
  const allowedRoots = loadRootsFromConfig();

  const client = new Client(
    { name, version: '1.0.0' },
    {
      capabilities: {
        roots: { listChanged: true },
      },
    }
  );

  client.setRequestHandler(ListRootsRequestSchema, async () => {
    return { roots: allowedRoots };
  });

  return client;
}
