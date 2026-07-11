"use client";

/**
 * CurrencySwitcher — minimal header dropdown to pick the DISPLAY currency.
 * Purely cosmetic: orders always settle in MAD (see CurrencyContext).
 */
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDown, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function CurrencySwitcher() {
	const { t } = useTranslation();
	const { currencies, currency, setCurrencyCode } = useCurrency();

	if (!currencies || currencies.length <= 1) return null;

	return (
		<Menu as="div" className="relative">
			{({ open }) => (
				<>
					<Menu.Button
						aria-label={t("chrome.navbar.changeCurrency", "Change currency")}
						className="flex items-center gap-1.5 py-1.5 px-3 text-gray-600 hover:text-indigo-700 border border-gray-200 bg-white rounded-full text-sm font-medium transition hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
						aria-expanded={open}
						aria-haspopup="true"
					>
						<Coins className="h-4 w-4" aria-hidden="true" />
						<span>{currency.code}</span>
						<ChevronDown
							className={cn(
								"h-3 w-3 transition-transform",
								open && "rotate-180",
							)}
							aria-hidden="true"
						/>
					</Menu.Button>
					<Transition
						as={Fragment}
						enter="transition ease-out duration-100"
						enterFrom="transform opacity-0 scale-95"
						enterTo="transform opacity-100 scale-100"
						leave="transition ease-in duration-75"
						leaveFrom="transform opacity-100 scale-100"
						leaveTo="transform opacity-0 scale-95"
					>
						<Menu.Items className="absolute end-0 z-20 mt-2 w-40 origin-top-end bg-white shadow-xl ring-1 ring-gray-200 rounded-2xl py-2 focus:outline-none">
							{currencies.map((c) => (
								<Menu.Item key={c.code}>
									{({ active }) => (
										<button
											onClick={() => setCurrencyCode(c.code)}
											className={cn(
												"block w-full text-left px-4 py-2 text-sm transition",
												active
													? "bg-indigo-50 text-indigo-700"
													: "text-gray-700",
												currency.code === c.code
													? "font-semibold text-indigo-700"
													: "",
											)}
										>
											{c.code}
											<span className="text-gray-400 ms-1">{c.symbol}</span>
										</button>
									)}
								</Menu.Item>
							))}
						</Menu.Items>
					</Transition>
				</>
			)}
		</Menu>
	);
}
