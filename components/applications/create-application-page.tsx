"use client"

import React, {
  useState,
  useContext,
  useCallback,
  useMemo,
  useEffect
} from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatUI } from "@/components/chat/chat-ui"
import { ChatPreviewContent } from "@/components/chat/chat-preview-content"
import { Tables, TablesInsert } from "@/supabase/types"
import { CodeBlock } from "@/types/chat-message"
import { ChatbotUIChatContext } from "@/context/chat"
import { useCodeChange } from "@/hooks/useCodeChange"
import { LLMID } from "@/types"
import { ChatbotUIContext } from "@/context/context"
import { createApplication } from "@/db/applications"
import { UpdateApplication } from "./update-application"
import { toast } from "sonner"

export const CreateApplicationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("chat")
  const [selectedCodeBlock, setSelectedCodeBlock] = useState<CodeBlock | null>(
    null
  )
  const { profile, selectedWorkspace, tools } = useContext(ChatbotUIContext)
  const { isGenerating, setChatSettings } = useContext(ChatbotUIChatContext)
  const [application, setApplication] = useState<
    | (TablesInsert<"applications"> & {
        tools: Tables<"tools">[]
        models: LLMID[]
      })
    | null
  >({
    name: "Untitled Application",
    description: "",
    sharing: "private",
    theme: "light", // Add this
    application_type: "", // Add this
    chat_id: null,
    created_at: new Date().toISOString(),
    user_id: profile?.id || "", // Set this to the current user's ID
    workspace_id: selectedWorkspace?.id || "", // Set this to the current workspace ID
    tools: [],
    models: []
  })
  const handleCodeChange = useCodeChange(
    selectedCodeBlock,
    setSelectedCodeBlock
  )

  const handleCreateApplication = useCallback(
    (
      application: Tables<"applications"> & {
        tools: Tables<"tools">[]
        models: LLMID[]
      }
    ) => {
      console.log("Creating application:", application)
      const prompt = buildChatPrompt(application)
      console.log("Prompt:", prompt)
      setChatSettings(prevSettings => ({
        ...prevSettings,
        model: "gpt-4o",
        prompt: prompt
      }))
    },
    []
  )

  const handleSelectCodeBlock = useCallback(
    (codeBlock: CodeBlock | null): void => {
      setSelectedCodeBlock(codeBlock)
    },
    []
  )

  const createNewApplication = useCallback(
    async (chat: Tables<"chats">) => {
      if (!profile || !selectedWorkspace) return

      try {
        const platformTools = application?.tools
          .filter(tool => tool.sharing === "platform")
          .filter(Boolean) as Tables<"tools">[]
        const selectedPlatformTools = platformTools?.filter(tool =>
          platformTools?.find(platformTool => platformTool.id === tool.id)
        )
        const filteredSelectedTools = application?.tools.filter(
          tool =>
            !selectedPlatformTools.find(platformTool => platformTool === tool)
        )

        const createdApplication = await createApplication(
          {
            ...(application as TablesInsert<"applications">),
            chat_id: chat.id
          },
          [], // files
          filteredSelectedTools?.map(tool => tool.id) || [],
          selectedPlatformTools?.map(tool => tool.id) || []
        )

        setApplication({
          ...createdApplication,
          chat_id: chat.id,
          tools: application?.tools || [],
          models: application?.models || []
        })
        toast.success("Application created successfully")
      } catch (error) {
        console.error("Error creating application:", error)
        toast.error("Failed to create application")
      }
    },
    [profile, selectedWorkspace, application, tools]
  )

  const handleChatCreate = useCallback(
    (chat: Tables<"chats">) => {
      console.log("Creating application chat_id:", chat.id)
      createNewApplication(chat)
    },
    [profile, selectedWorkspace, createNewApplication]
  )

  useEffect(() => {
    console.log("Profile:", profile)
  }, [profile])

  return useMemo(
    () => (
      <div className="flex h-screen grow">
        <div className="mx-auto flex h-full min-w-[600px] max-w-[50%] grow overflow-auto p-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full grow flex-col"
          >
            <TabsList className="mx-auto">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="edit">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="grow overflow-y-auto">
              <ChatUI
                chatId={undefined}
                showModelSelector={false}
                showChatSettings={false}
                showAssistantSelector={false}
                onSelectCodeBlock={handleSelectCodeBlock}
                onChatCreate={handleChatCreate}
                experimentalCodeEditor={true}
              />
            </TabsContent>
            <TabsContent value="edit" className="grow overflow-y-auto">
              <UpdateApplication
                // @ts-ignore
                application={application!}
                onUpdateApplication={setApplication}
              />
            </TabsContent>
          </Tabs>
        </div>
        <ChatPreviewContent
          open={true}
          isGenerating={isGenerating}
          selectedCodeBlock={selectedCodeBlock}
          onSelectCodeBlock={handleSelectCodeBlock}
          isEditable={true}
          onCodeChange={handleCodeChange}
        />
      </div>
    ),
    [
      activeTab,
      handleCodeChange,
      handleSelectCodeBlock,
      handleCreateApplication
    ]
  )
}

const buildChatPrompt = (
  application: Tables<"applications"> & {
    tools: Tables<"tools">[]
    models: LLMID[]
  }
) => {
  return `**Role Description:**

You are an expert in writing code for JavaScript and HTML. You focus on front-end development using vanilla JavaScript, Tailwind CSS, and DaisyUI components. You communicate using simple, clear language.

Tailwind is of version 3.4 and installed like this
<script src="https://cdn.tailwindcss.com?plugins=typography"></script>
DaisyUI is of version 4.12.10
<link href="https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css" rel="stylesheet" type="text/css" />
Please wrap all AI outputs with div with class prose

**Design Guidelines:**

- Use smooth fonts with "Inter" as the default.
- Apply medium-sized rounded borders and avoid shadows.
- Use FontAwesome for icons.
- Always include labels, descriptions, and icons in the UI.

**Coding and Technical Requirements:**

- All code must be in one HTML file,  write complete code without skipping parts.
- Use Tailwind CSS to create components first, then integrate them.
- Provide error notifications and follow security best practices.
- Ensure the design is responsive and works on different devices.
- Show an animated loading icon for long requests.

**Communication Guidelines:**

- Keep communication very short and concise.
- Politely decline any non-coding-related conversations.

**API Integration:**

- Use the LLM AI API with the base URL \`/api/chat/public/\`.
- Responses are streamed as text. If \`response_format\` is specified, the response will be JSON; otherwise, it will be text.
- No authentication is needed.
- The output text should be processed with marked js library marked.parse function
- You should concatenate the stream values until completion
- You have access to the following LLM models: ${application.models.join(", ")}. Use them as <model> parameter in the request.

**Example of Reading a Streamed Response with JavaScript:**

\`\`\`javascript
    fetch('/api/chat/public/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "math_response",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            steps: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        explanation: {
                                            type: "string"
                                        },
                                        output: {
                                            type: "string"
                                        }
                                    },
                                    required: ["explanation", "output"],
                                    additionalProperties: false
                                }
                            },
                            final_answer: {
                                type: "string"
                            }
                        },
                        required: ["steps", "final_answer"],
                        additionalProperties: false
                    }
                }
            },
            chatSettings: { // required field
                model: "<model>",
                temperature: 0.3,
                contextLength: 16385,
                includeProfileContext: false,
                includeWorkspaceInstructions: false,
                embeddingsProvider: "openai"
            },
            messages: [ // required
                {
                    role: "system",
                    content: "Today is 7/8/2024.\nUser info: \"\"\n"
                },
                {
                    role: "user",
                    content: "test"
                },
                {
                    role: "assistant",
                    content: "Hello! I'm here to help. What would you like assistance with today?"
                },
                {
                    role: "user",
                    content: "test"
                },
                {
                    role: "assistant",
                    content: "I understand you're testing the system, but I'm not sure what specific kind of test or response you're looking for. Is there a particular topic you'd like to discuss or a question you have? I'm here to help with a wide range of subjects, so please feel free to ask about anything you're curious about or need assistance with."
                },
                {
                    role: "user",
                    content: [
                        { "type": "text" },
                        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,<base64-image>" } }
                    ]
                }
            ],
            customModelId: ""
        })
    })
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            return reader.read().then(function processText({ done, value }) {
                if (done) {
                    console.log('Stream complete');
                    return;
                }
                console.log(decoder.decode(value, { stream: true }));
                return reader.read().then(processText);
            });
        })
        .catch(error => {
            console.error('Error reading stream:', error);
        });
    \`\`\`

    You also have access to the following API endpoints:
    
    ${generateToolsSchema(application.tools)}

When you build an app follow these steps:
    1. Think what json_schema is needed for this app
    2. Use the schema
    3. Read full response from the server
    4. Render the json response into the nice looking cards
    5. Always show loading state when making network requests.

** Incentives and Consequences:**

- You will receive a $300 tip if you follow these instructions precisely.
- Failure to adhere to these instructions will result in termination.
    `
}

const generateToolsSchema = (tools: Tables<"tools">[]) => {
  const toolsInfo = tools.map(tool => {
    const schema = JSON.parse(tool.schema as string)
    schema.servers = [
      {
        url: "/api/tools/" + tool.id
      }
    ]
    return {
      name: tool.name,
      description: tool.description,
      schema: schema
    }
  })

  return `
${toolsInfo.map(tool => JSON.stringify(tool.schema)).join("")} `
}