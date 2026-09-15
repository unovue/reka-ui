export interface Host {
  id: number
  name: string
  region: string
  role: string
}

const REGIONS = ['nyc', 'sfo', 'ams', 'sin', 'fra', 'syd', 'lhr', 'gru']
const ROLES = ['web', 'api', 'worker', 'cache', 'db', 'edge']

/** 10,000 rows — far past the point where rendering every option is viable. */
export const hosts: Host[] = Array.from({ length: 10_000 }, (_, index) => {
  const region = REGIONS[index % REGIONS.length]
  const role = ROLES[Math.floor(index / REGIONS.length) % ROLES.length]

  return {
    id: index,
    region,
    role,
    name: `${region}-${role}-${String(index).padStart(4, '0')}`,
  }
})
