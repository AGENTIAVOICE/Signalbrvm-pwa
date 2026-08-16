import { Building2, Plane, Landmark, Store, Factory, Car, Zap, Shirt, Briefcase, BookOpen, Wheat, Radio, Sprout, Truck, HardHat, type LucideIcon } from 'lucide-react'

export const SECTOR_ICONS: Record<string, LucideIcon> = {
  Aviation: Plane,
  Bancaire: Landmark,
  Distribution: Store,
  Industrie: Factory,
  'Distribution automobile': Car,
  Énergie: Zap,
  'Industrie textile': Shirt,
  Services: Briefcase,
  Édition: BookOpen,
  Agroalimentaire: Wheat,
  Télécommunications: Radio,
  'Agro-industrie': Sprout,
  'Services financiers': Landmark,
  'Transport et logistique': Truck,
  BTP: HardHat,
}

export function sectorIcon(sector: string): LucideIcon {
  return SECTOR_ICONS[sector] ?? Building2
}
