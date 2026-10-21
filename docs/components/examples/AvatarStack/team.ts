export interface Member {
  id: number
  name: string
  handle: string
  role: string
  avatar?: string
  bio: string
}

export const team: Member[] = [
  {
    id: 1,
    name: 'Ada Lovelace',
    handle: 'ada',
    role: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&dpr=2&q=80',
    bio: 'Wrote the first algorithm intended for a machine. Currently reviewing your pull request.',
  },
  {
    id: 2,
    name: 'Grace Hopper',
    handle: 'grace',
    role: 'Compilers',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&dpr=2&q=80',
    bio: 'Believes it is easier to ask forgiveness than permission. Keeps a nanosecond on her desk.',
  },
  {
    id: 3,
    name: 'Radia Perlman',
    handle: 'radia',
    // No avatar on purpose — AvatarFallback covers the gap.
    role: 'Infrastructure',
    bio: 'Designed the spanning tree protocol. Would rather you called her something other than a mother of anything.',
  },
  {
    id: 4,
    name: 'Katherine Johnson',
    handle: 'katherine',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&h=128&dpr=2&q=80',
    role: 'Research',
    bio: 'Computed trajectories by hand and checked the computer afterwards.',
  },
  {
    id: 5,
    name: 'Barbara Liskov',
    handle: 'barbara',
    role: 'Research',
    bio: 'If it looks like a subtype and behaves like a subtype, it had better be substitutable.',
  },
  {
    id: 6,
    name: 'Frances Allen',
    handle: 'frances',
    role: 'Compilers',
    bio: 'Spent a career making other people’s programs faster than they wrote them.',
  },
]

export function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2)
}

/** Stands in for the request a real profile card would make on first hover. */
export function loadProfile(member: Member): Promise<{ followers: number, projects: number }> {
  return new Promise(resolve => setTimeout(resolve, 500, {
    followers: 120 + member.id * 137,
    projects: 3 + (member.id % 5),
  }))
}
