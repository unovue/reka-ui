export type PaymentStatus = 'paid' | 'pending' | 'failed'

export interface Payment {
  id: number
  customer: string
  email: string
  status: PaymentStatus
  amount: number
}

export const payments: Payment[] = [
  { id: 1, customer: 'Ada Lovelace', email: 'ada@analytical.co', status: 'paid', amount: 316 },
  { id: 2, customer: 'Alan Turing', email: 'alan@bletchley.uk', status: 'pending', amount: 242 },
  { id: 3, customer: 'Grace Hopper', email: 'grace@cobol.mil', status: 'paid', amount: 837 },
  { id: 4, customer: 'Katherine Johnson', email: 'katherine@nasa.gov', status: 'failed', amount: 121 },
  { id: 5, customer: 'Barbara Liskov', email: 'barbara@mit.edu', status: 'paid', amount: 654 },
  { id: 6, customer: 'Margaret Hamilton', email: 'margaret@apollo.io', status: 'pending', amount: 428 },
  { id: 7, customer: 'Radia Perlman', email: 'radia@spanning.net', status: 'paid', amount: 903 },
  { id: 8, customer: 'Anita Borg', email: 'anita@systers.org', status: 'paid', amount: 175 },
  { id: 9, customer: 'Frances Allen', email: 'frances@ibm.com', status: 'failed', amount: 512 },
  { id: 10, customer: 'Jean Bartik', email: 'jean@eniac.edu', status: 'paid', amount: 289 },
  { id: 11, customer: 'Shafi Goldwasser', email: 'shafi@crypto.ac', status: 'pending', amount: 764 },
  { id: 12, customer: 'Elizabeth Feinler', email: 'elizabeth@arpanet.net', status: 'paid', amount: 341 },
  { id: 13, customer: 'Karen Spärck Jones', email: 'karen@idf.ac.uk', status: 'paid', amount: 598 },
  { id: 14, customer: 'Evelyn Boyd Granville', email: 'evelyn@vanguard.gov', status: 'pending', amount: 187 },
  { id: 15, customer: 'Mary Allen Wilkes', email: 'mary@linc.dev', status: 'paid', amount: 726 },
  { id: 16, customer: 'Adele Goldberg', email: 'adele@smalltalk.org', status: 'failed', amount: 233 },
  { id: 17, customer: 'Sophie Wilson', email: 'sophie@acorn.uk', status: 'paid', amount: 881 },
  { id: 18, customer: 'Lynn Conway', email: 'lynn@vlsi.edu', status: 'paid', amount: 405 },
  { id: 19, customer: 'Carol Shaw', email: 'carol@atari.com', status: 'pending', amount: 159 },
  { id: 20, customer: 'Roberta Williams', email: 'roberta@sierra.com', status: 'paid', amount: 672 },
  { id: 21, customer: 'Erna Hoover', email: 'erna@bell.labs', status: 'paid', amount: 314 },
  { id: 22, customer: 'Hedy Lamarr', email: 'hedy@spectrum.fm', status: 'failed', amount: 947 },
  { id: 23, customer: 'Susan Kare', email: 'susan@chicago.font', status: 'paid', amount: 268 },
]

export const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const statusStyles: Record<PaymentStatus, string> = {
  paid: 'bg-green4 text-grass11',
  pending: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive/15 text-destructive',
}
