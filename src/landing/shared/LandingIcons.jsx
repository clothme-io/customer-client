export function IconPerson({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="16" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 38c2.2-7.5 8-11 12-11s9.8 3.5 12 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconShirt({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M16 15l8-5 8 5 5-2.5 3.5 7.5-5 2.5V38H17.5V22.5l-5-2.5L16 12.5 16 15z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHeart({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 38s-12-7.2-12-15.5A6.8 6.8 0 0 1 24 16a6.8 6.8 0 0 1 12 6.5C36 30.8 24 38 24 38z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFamily({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="17" cy="16" r="4.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="31" cy="16" r="4.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="24" cy="27" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 38c1.2-5.5 4.8-8 9-8M40 38c-1.2-5.5-4.8-8-9-8M16 38c.9-4.2 3.5-6 8-6s7.1 1.8 8 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconShield({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 9l13 5.5v9.5c0 9-5.5 14.5-13 16.5-7.5-2-13-7.5-13-16.5V14.5L24 9z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M18.5 23.5l3.5 3.5 7-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClock({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="12.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M24 16.5V24l5.5 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBag({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M15 18h18l1.8 20H13.2L15 18z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M19 18a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconArrow({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 24" fill="none" aria-hidden="true">
      <path d="M2 12h40M36 5l8 7-8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const benefitIcons = [IconPerson, IconShirt, IconHeart, IconFamily, IconShield, IconClock];
export const stepIcons = [IconPerson, IconShirt, IconBag];
export const familyPointIcons = [IconPerson, IconFamily, IconHeart, IconBag];
