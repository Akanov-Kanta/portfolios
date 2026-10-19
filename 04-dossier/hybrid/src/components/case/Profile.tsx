import { site } from "@/content/site";
import { SectionHead } from "./SectionHead";

/**
 * 03 PROFILE: one statement in the display face, then four mono columns on the grid (bio, record, stack,
 * now). No captions, no glow: this is the part a recruiter scans.
 */
export function Profile() {
  return (
    <section id="profile" aria-labelledby="profile-title" className="profile">
      <SectionHead id="profile-title" index="03" title="Profile" note="Bio, record, stack" />
      <div className="grid">
        <p className="profile-statement display">{site.statement}</p>
      </div>
      <div className="grid profile-cols mono">
        <div className="pcol pcol-bio">
          <h3 className="pcol-k">Bio</h3>
          {site.bio.map((b) => (
            <p key={b}>{b}</p>
          ))}
        </div>
        <div className="pcol">
          <h3 className="pcol-k">Record</h3>
          <dl className="plist">
            {site.record.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="pcol">
          <h3 className="pcol-k">Stack</h3>
          <ol className="plist">
            {site.skills.map((s, i) => (
              <li key={s}>
                <span className="plist-n">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="pcol">
          <h3 className="pcol-k">Now</h3>
          <p>{site.currently}</p>
          <p>Digging into fine-tuning and evaluation.</p>
          <h3 className="pcol-k pcol-k2">Based</h3>
          <p>
            {site.location.city}, {site.location.country}
            <br />
            {site.location.lat} {site.location.lng}
          </p>
        </div>
      </div>
    </section>
  );
}
