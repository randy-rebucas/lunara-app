import { NextResponse } from 'next/server'

const FAQS = [
  {
    id: 1,
    question: 'How do I place a laundry order?',
    answer:
      'Go to the Orders section, tap "New Order," fill in your items, select a pickup time and address, choose your payment method, and confirm.',
  },
  {
    id: 2,
    question: 'What laundry services do you offer?',
    answer:
      'We offer wash & fold, dry cleaning, ironing, and express services. Pricing depends on the service and quantity.',
  },
  {
    id: 3,
    question: 'How long does laundry processing take?',
    answer:
      'Standard service takes 24–48 hours. Express service is available within 12 hours for an additional fee.',
  },
  {
    id: 4,
    question: 'How does the wallet work?',
    answer:
      'Top up your wallet using the Wallet section. Your balance can be used to pay for orders. All transactions are recorded for your reference.',
  },
  {
    id: 5,
    question: 'Can I cancel my order?',
    answer:
      'You can cancel an order as long as it has not been picked up yet. Go to Order Details and tap "Cancel Order."',
  },
  {
    id: 6,
    question: 'How does the referral program work?',
    answer:
      'Share your unique referral code with friends. When they place their first order, both of you earn wallet credits automatically.',
  },
  {
    id: 7,
    question: 'How do I track my order?',
    answer:
      'Open the order in the Orders section. The status will update in real-time as your laundry moves through our process.',
  },
  {
    id: 8,
    question: 'What areas do you service?',
    answer:
      'We currently service select areas. Enter your address when placing an order to check availability in your location.',
  },
]

export function GET() {
  return NextResponse.json({ success: true, data: FAQS })
}
