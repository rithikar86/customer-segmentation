import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_email, customer_name, offer_text } = body

    if (!customer_email || !customer_name) {
      return NextResponse.json(
        { error: "Missing required fields: customer_email, customer_name" },
        { status: 400 }
      )
    }

    // Call the Python backend
    const pythonResponse = await fetch("http://localhost:5000/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_email,
        customer_name,
        offer_text: offer_text || "Special offer just for you!",
      }),
    })

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.text()
      console.error("[v0] Python backend error:", errorData)
      return NextResponse.json(
        { error: `Backend error: ${pythonResponse.status}`, details: errorData },
        { status: pythonResponse.status }
      )
    }

    const result = await pythonResponse.json()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] API route error:", error)
    return NextResponse.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
