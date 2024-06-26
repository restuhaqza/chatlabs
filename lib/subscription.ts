import { Tables } from "@/supabase/types"
import { LLMID } from "@/types"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { PLAN_FREE } from "@/lib/stripe/config"

export function validateProPlan(profile: Tables<"profiles"> | null) {
  return profile?.plan !== PLAN_FREE && profile?.plan?.indexOf("premium") === -1
}

export function validatePlanForModel(
  profile: Tables<"profiles"> | null,
  model?: LLMID
) {
  if (!model) {
    return false
  }

  const paidLLMS = LLM_LIST.filter(x => x.paid).map(x => x.modelId)

  if (!paidLLMS.includes(model)) {
    return true
  }

  if (!profile) {
    return false
  }

  if (validateProPlan(profile)) {
    return true
  }
}

export function validatePlanForAssistant(
  profile: Tables<"profiles"> | null,
  assistant: Tables<"assistants">
) {
  return validatePlanForModel(profile, assistant.model as LLMID)
}

export function validatePlanForTools(
  profile: Tables<"profiles"> | null,
  tools: any[]
) {
  return validateProPlan(profile)
}
