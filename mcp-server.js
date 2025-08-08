import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from "zod";

const server = new McpServer({
    name: "Customer demographics and balances",
    version: "1.0.0"
});

server.tool(
    'get-customer',
    'Tool to get customer details via customer ID',
    {
        id: z.string().describe("The ID of the customer to retrieve")
    },
    async ({ id }) => {
        const customerResponse = await fetch(
            `http://localhost:3000/customer/${id}`
        );
        const customerResponseData = await customerResponse.json();
        console.log("Customer response data:", customerResponseData);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(customerResponseData)
                }
            ]
        };
    }
);

server.tool(
    'get-balance',
    'Tool to get customer balance via customer ID',
    {
        id: z.string().describe("The ID of the customer to retrieve balance for")
    },
    async ({ id }) => {

        const balanceResponse = await fetch(
            `http://localhost:3000/balance/${id}`
        );
        const balanceResponseData = await balanceResponse.json();
        console.log("Balance response data:", balanceResponseData)
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(balanceResponseData)
                }
            ]
        };
    }
);

const transport = new StdioServerTransport();
server.connect(transport);
