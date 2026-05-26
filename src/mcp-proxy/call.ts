/**
 * Copyright (C) 2024 PoAI (Lutz Leonhardt), quarterstar (quarterstar@proton.me)
 * This file is part of mcpm, based on work by MCP Club
 * Licensed under the GNU AGPL v3.0
 * See LICENSE file for details
 */

import { HostService, HostType } from '@mcpm/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { buildTransportForServer } from './transportHelper.js';
import { createMcpClient } from "./client.js";
import Ajv from 'ajv/dist/2020.js';
import draft7MetaSchema from 'ajv/dist/refs/json-schema-draft-07.json' with { type: 'json' };

export async function callToolFunction(
  tool: string,
  functionName: string,
  parameters: any
): Promise<void> {
  const claudeSrv = HostService.getInstanceByType(HostType.CLAUDE);
  const server = await claudeSrv.getMCPServerWithStatus(tool);
  if (!server || !server.enabled) {
    throw new Error(
      `MCP server with identifier '${tool}' is not available or not enabled.`
    );
  }

  if (typeof parameters !== 'object' || parameters === null) {
    throw new Error(
      'Invalid parameters: Expected a JSON object. Please check your JSON formatting.'
    );
  }

  if (process.env.DEBUG) {
    console.debug('Transport configuration (server arguments/env):', {
      args: server.info.appConfig.args,
      env: server.info.appConfig.env,
    });
  }

  const transport = buildTransportForServer(server);

  try {
    const client = await createMcpClient(tool);
    await client.connect(transport);

    const toolsResponse = await client.listTools();
    const toolInfo = toolsResponse.tools.find(t => t.name === functionName);
    if (toolInfo && toolInfo.inputSchema) {
      // @ts-ignore: Ajv works at runtime despite the TypeScript error
      const ajv = new Ajv();

      ajv.addMetaSchema(draft7MetaSchema);

      const validate = ajv.compile(toolInfo.inputSchema);
      if (!validate(parameters)) {
        throw new Error(
          'Invalid parameters: ' + ajv.errorsText(validate.errors)
        );
      }
    }

    const result = await client.callTool({
      name: functionName,
      arguments: parameters,
    });
    console.log('Tool call result:', result);
  } catch (error) {
    console.error(
      `Error calling function '${functionName}' on MCP server '${tool}':`,
      error instanceof Error ? error.message : error
    );
    throw error;
  } finally {
    await transport.close();
  }
}
