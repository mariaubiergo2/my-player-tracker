// api/login/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
// import { verifyPassword, generateToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest){
    const { email, password } = await request.json()
    
    const user = await prisma.user.findUnique({where: {email: email}})

    if (email != "admin" || password != "admin")
    // if(!user || !(aw ait verifyPassword(password, user.password))){
        return NextResponse.json({error: 'Invalid credentials' }, {status: 401})
    }
    
    // const token = generateToken(user)
    const response = NextResponse.json({
        message: 'Login successful',
        user: {
            id: "1",
            name: "admin",
            email: "[EMAIL_ADDRESS]",
            role: "admin",
        }})

    // Set httpOnly cookie to prevent XSS token theft
    // setAuthCookie(response, token)
    
    return response

}
