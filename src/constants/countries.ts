export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

// Flag emoji from ISO 3166-1 alpha-2 code
function getFlagEmoji(countryCode: string): string {
  return [...countryCode.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}

const rawCountries: [string, string, string][] = [
  ["IT", "Italy", "+39"],
  ["AF", "Afghanistan", "+93"],
  ["AL", "Albania", "+355"],
  ["DZ", "Algeria", "+213"],
  ["AD", "Andorra", "+376"],
  ["AO", "Angola", "+244"],
  ["AR", "Argentina", "+54"],
  ["AM", "Armenia", "+374"],
  ["AU", "Australia", "+61"],
  ["AT", "Austria", "+43"],
  ["AZ", "Azerbaijan", "+994"],
  ["BH", "Bahrain", "+973"],
  ["BD", "Bangladesh", "+880"],
  ["BY", "Belarus", "+375"],
  ["BE", "Belgium", "+32"],
  ["BA", "Bosnia and Herzegovina", "+387"],
  ["BR", "Brazil", "+55"],
  ["BG", "Bulgaria", "+359"],
  ["CA", "Canada", "+1"],
  ["CL", "Chile", "+56"],
  ["CN", "China", "+86"],
  ["CO", "Colombia", "+57"],
  ["HR", "Croatia", "+385"],
  ["CY", "Cyprus", "+357"],
  ["CZ", "Czech Republic", "+420"],
  ["DK", "Denmark", "+45"],
  ["EG", "Egypt", "+20"],
  ["EE", "Estonia", "+372"],
  ["ET", "Ethiopia", "+251"],
  ["FI", "Finland", "+358"],
  ["FR", "France", "+33"],
  ["GE", "Georgia", "+995"],
  ["DE", "Germany", "+49"],
  ["GH", "Ghana", "+233"],
  ["GR", "Greece", "+30"],
  ["HU", "Hungary", "+36"],
  ["IS", "Iceland", "+354"],
  ["IN", "India", "+91"],
  ["ID", "Indonesia", "+62"],
  ["IR", "Iran", "+98"],
  ["IQ", "Iraq", "+964"],
  ["IE", "Ireland", "+353"],
  ["IL", "Israel", "+972"],
  ["JP", "Japan", "+81"],
  ["JO", "Jordan", "+962"],
  ["KZ", "Kazakhstan", "+7"],
  ["KE", "Kenya", "+254"],
  ["KW", "Kuwait", "+965"],
  ["LV", "Latvia", "+371"],
  ["LB", "Lebanon", "+961"],
  ["LY", "Libya", "+218"],
  ["LI", "Liechtenstein", "+423"],
  ["LT", "Lithuania", "+370"],
  ["LU", "Luxembourg", "+352"],
  ["MY", "Malaysia", "+60"],
  ["MT", "Malta", "+356"],
  ["MX", "Mexico", "+52"],
  ["MD", "Moldova", "+373"],
  ["MC", "Monaco", "+377"],
  ["ME", "Montenegro", "+382"],
  ["MA", "Morocco", "+212"],
  ["NL", "Netherlands", "+31"],
  ["NZ", "New Zealand", "+64"],
  ["NG", "Nigeria", "+234"],
  ["MK", "North Macedonia", "+389"],
  ["NO", "Norway", "+47"],
  ["OM", "Oman", "+968"],
  ["PK", "Pakistan", "+92"],
  ["PS", "Palestinian Territory", "+970"],
  ["PA", "Panama", "+507"],
  ["PE", "Peru", "+51"],
  ["PH", "Philippines", "+63"],
  ["PL", "Poland", "+48"],
  ["PT", "Portugal", "+351"],
  ["QA", "Qatar", "+974"],
  ["RO", "Romania", "+40"],
  ["RU", "Russia", "+7"],
  ["SA", "Saudi Arabia", "+966"],
  ["SN", "Senegal", "+221"],
  ["RS", "Serbia", "+381"],
  ["SG", "Singapore", "+65"],
  ["SK", "Slovakia", "+421"],
  ["SI", "Slovenia", "+386"],
  ["ZA", "South Africa", "+27"],
  ["KR", "South Korea", "+82"],
  ["ES", "Spain", "+34"],
  ["SE", "Sweden", "+46"],
  ["CH", "Switzerland", "+41"],
  ["TN", "Tunisia", "+216"],
  ["TR", "Turkey", "+90"],
  ["UA", "Ukraine", "+380"],
  ["AE", "United Arab Emirates", "+971"],
  ["GB", "United Kingdom", "+44"],
  ["US", "United States", "+1"],
  ["VE", "Venezuela", "+58"],
  ["VN", "Vietnam", "+84"],
];

export const countries: Country[] = rawCountries.map(([code, name, dialCode]) => ({
  code,
  name,
  dialCode,
  flag: getFlagEmoji(code),
}));

export function findCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function findCountryByDialCode(dialCode: string): Country | undefined {
  return countries.find((c) => c.dialCode === dialCode);
}
