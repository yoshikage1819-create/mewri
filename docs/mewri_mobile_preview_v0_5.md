# Mewri Mobile Preview v0.5

## Purpose

Use this workflow to preview the local Mewri web app from a smartphone on the same Wi-Fi network. This is only a local development workflow. It does not change product behavior, add authentication, connect to a database, or enable public discovery.

## Start the Network Dev Server

From the project root:

```powershell
npm.cmd run dev:host
```

This starts the Next.js dev server with host binding enabled:

```text
next dev --hostname 0.0.0.0
```

Keep the terminal open while testing from the phone.

The existing local-only command is unchanged:

```powershell
npm.cmd run dev
```

## Find the Windows Local IP Address

In a separate PowerShell window, run:

```powershell
ipconfig
```

Look for the active Wi-Fi adapter and copy the `IPv4 Address`, for example:

```text
IPv4 Address . . . . . . . . . . . : 192.168.1.25
```

Use the address from your own machine, not the example.

## Open From a Phone

Connect the phone to the same Wi-Fi network as the Windows PC.

In the phone browser, open:

```text
http://<LOCAL_IP>:3000
```

Example:

```text
http://192.168.1.25:3000
```

If Next.js starts on a different port because `3000` is already busy, use the port shown in the terminal.

## Allow the Local Network Origin

Next.js dev mode can block browser runtime resources from a phone IP unless the host is allowed.

For this machine, `apps/web/next.config.ts` includes:

```ts
allowedDevOrigins: ["192.168.1.11"]
```

If your PC's Wi-Fi IP changes, update that value to the new IPv4 address and restart the dev server.

## Troubleshooting

- Phone and PC must be on the same local network. Guest Wi-Fi networks often block device-to-device traffic.
- Windows Firewall may ask whether to allow Node.js or Next.js. Allow access for private networks if you trust the network.
- VPN software can prevent local network access. Disconnect the VPN or enable local network access in the VPN settings.
- Port `3000` may already be in use. Stop the other dev server or use the alternate port printed by Next.js.
- Use `http://`, not `https://`, for the local dev server unless you explicitly configure HTTPS later.
- If the page loads but stays on `Loading Mewri...`, check the dev server log for a blocked cross-origin request and update `allowedDevOrigins`.
- If the phone cannot connect, confirm the app responds on the PC at `http://localhost:3000` first.

