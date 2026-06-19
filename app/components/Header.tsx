import Link from "next/link";

export function Header() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">daisyUI</a>
      </div>

      <div className="flex-none">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/matches">Matches</Link></li>
          <li><Link href="/">About</Link></li>
          <li><Link href="/login">Login</Link></li>
          <li><Link href="/register">Register</Link></li>
        </ul>
      </div>
    </div>
  )
}