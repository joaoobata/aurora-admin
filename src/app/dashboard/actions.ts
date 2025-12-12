'use server'

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function createAccount(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error("❌ createAccount: User not found or auth error", authError)
    return { error: "Unauthorized: Please log in again." }
  }

  const username = formData.get("username") as string
  const platform = formData.get("platform") as string
  const url = formData.get("url") as string
  const status = formData.get("status") as string || 'active'

  console.log(`📝 Creating account for user ${user.id}: ${username} (${platform})`)

  if (!username || !platform) {
    return { error: "Username and platform are required" }
  }

  const { error, data } = await supabase.from("accounts").insert({
    user_id: user.id,
    username,
    platform,
    url,
    status
  }).select().single()

  if (error) {
    console.error("❌ createAccount DB Error:", error)
    return { error: `Database Error: ${error.message}` }
  }

  console.log("✅ Account created successfully:", data)

  revalidatePath("/dashboard/accounts")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteAccount(accountId: string) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase.from("accounts").delete().eq("id", accountId)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/accounts")
    revalidatePath("/dashboard")
    return { success: true }
}

export async function createGoal(formData: FormData) {
    const supabase = await createClient()
  
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }
  
    const accountId = formData.get("accountId") as string
    const metricType = formData.get("metricType") as string
    const targetValue = parseInt(formData.get("targetValue") as string)
    const deadline = formData.get("deadline") as string

    if (!accountId || !metricType || !targetValue) {
        return { error: "Missing required fields" }
    }
  
    const { error } = await supabase.from("goals").insert({
        account_id: accountId,
        metric_type: metricType,
        target_value: targetValue,
        deadline: deadline || null
    })
  
    if (error) return { error: error.message }
  
    revalidatePath("/dashboard/goals")
    return { success: true }
  }

  export async function deleteGoal(goalId: string) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase.from("goals").delete().eq("id", goalId)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/goals")
    return { success: true }
}
