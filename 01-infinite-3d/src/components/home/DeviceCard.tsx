/**
 * DOM stand-in for a project's 3D device, inside a phone frame slot ([data-frame-slot="device"]):
 * a 16:10 bordered frame with the project name in mono over its accent glow (or the project's
 * screenshot). It holds the slot before the world mounts and for good without WebGL; at webglReady it
 * cross-fades out (700 ms, CSS: html[data-world-ready], written by the phone-only PhoneHud) as the
 * canvas fades in. Server-rendered, no client JS. Only ever rendered inside 'hidden phone:*'.
 */
export function DeviceCard({ name, accent, screenshot }: { name: string; accent: string; screenshot?: string }) {
  return (
    <span data-device-card="" style={{ ["--accent" as string]: accent }}>
      <span data-device-screen="" style={screenshot ? { backgroundImage: `url(${JSON.stringify(screenshot)})` } : undefined}>
        {!screenshot && <span data-device-name="">{name}</span>}
      </span>
    </span>
  );
}
