'use client';

import { useTranslation } from 'react-i18next';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '@/config/constants';

export default function TermsOfServicePage() {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-8 px-4 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">{t('pages.termsOfService.title')}</h1>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-500">
            {t('pages.termsOfService.lastUpdated')}: May 18, 2025
          </p>
          
          <div className="mt-6 md:mt-10 prose prose-indigo prose-sm md:prose-base lg:prose-lg max-w-none">
            <div className="flex items-center mb-4 md:mb-6">
              <DocumentTextIcon className="h-6 w-6 md:h-8 md:w-8 text-indigo-600 mr-2 md:mr-4 flex-shrink-0" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('pages.termsOfService.userAgreement')}</h2>
            </div>
            
            <p>
              Welcome to Beldify. These Terms of Service ("Terms") govern your access to and use of the Beldify
              website, services, and applications (collectively, the "Services"). By accessing or using our Services,
              you agree to be bound by these Terms.
            </p>
            
            <p>
              Please read these Terms carefully before using our Services. If you do not agree to these Terms,
              you may not access or use the Services.
            </p>
            
            <h3>1. Account Registration and Requirements</h3>
            <p>
              To access certain features of our Services, you may be required to register for an account. When you register,
              you agree to provide accurate, current, and complete information and to update this information to maintain
              its accuracy. You are responsible for safeguarding your account credentials and for all activities that occur
              under your account. You must notify us immediately of any unauthorized use of your account.
            </p>
            
            <p>
              You must be at least 16 years of age to use our Services. If you are under the age of 18, you must have
              your parent or guardian's permission to use our Services.
            </p>
            
            <h3>2. User Conduct</h3>
            <p>
              When using our Services, you agree not to:
            </p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others, including privacy and intellectual property rights</li>
              <li>Use our Services to distribute unsolicited commercial messages (spam)</li>
              <li>Upload or transmit viruses, malware, or other harmful code</li>
              <li>Attempt to gain unauthorized access to our systems or user accounts</li>
              <li>Interfere with or disrupt our Services or servers</li>
              <li>Impersonate any person or entity</li>
              <li>Engage in any activity that could disable, overburden, or impair the proper functioning of our Services</li>
              <li>Collect or harvest user information without consent</li>
              <li>Use our Services for any illegal or unauthorized purpose</li>
            </ul>
            
            <h3>3. Products and Orders</h3>
            <p>
              All product descriptions, images, and prices are subject to change without notice. We reserve the right
              to limit quantities, refuse orders, or discontinue products at our discretion. We make reasonable efforts
              to display accurate colors and descriptions, but we cannot guarantee that your device's display accurately
              reflects the actual colors of products.
            </p>
            
            <p>
              When you place an order through our Services, you are making an offer to purchase the products in your cart.
              We reserve the right to accept or decline your offer for any reason, including product availability, errors
              in product information or pricing, or suspected fraudulent activity.
            </p>
            
            <h3>4. Seller Marketplace</h3>
            <p>
              Beldify provides a platform for sellers to offer their products to buyers. Sellers are independent third parties,
              and we are not responsible for their products, actions, or omissions. While we strive to ensure a safe and reliable
              marketplace, we cannot guarantee the quality, safety, or legality of products sold by third-party sellers.
            </p>
            
            <p>
              For sellers using our platform, additional terms apply. Please refer to the Seller Terms available at 
              {API_BASE_URL} for more information.
            </p>
            
            <h3>5. Payment and Pricing</h3>
            <p>
              By providing payment information, you represent and warrant that you have the legal right to use the payment
              method you provide. You authorize us to charge your payment method for the total amount of your order, including
              applicable taxes, shipping fees, and any other charges stated at checkout.
            </p>
            
            <p>
              All prices are displayed in your selected currency and do not include taxes or shipping costs unless otherwise
              specified. We reserve the right to correct pricing errors at any time before accepting your order.
            </p>
            
            <h3>6. Shipping and Delivery</h3>
            <p>
              Shipping times and costs vary based on the delivery location, product availability, and selected shipping method.
              Estimated delivery dates are not guaranteed. For complete information about our shipping policies, please see our
              Shipping Information page.
            </p>
            
            <h3>7. Returns and Refunds</h3>
            <p>
              Our return and refund policies are outlined on our Returns page. By placing an order, you agree to these policies.
              We reserve the right to modify our return and refund policies at any time.
            </p>
            
            <h3>8. Intellectual Property Rights</h3>
            <p>
              The Services, including all content, features, and functionality, are owned by Beldify, its licensors, or other
              providers and are protected by copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            
            <p>
              You may not use, reproduce, distribute, modify, create derivative works of, publicly display, publicly perform,
              republish, download, store, or transmit any content from our Services, except as permitted by these Terms or with
              our prior written consent.
            </p>
            
            <h3>9. User-Generated Content</h3>
            <p>
              By submitting content to our Services (such as reviews, comments, or posts in our community section), you grant
              Beldify a non-exclusive, royalty-free, perpetual, irrevocable, and fully sublicensable right to use, reproduce,
              modify, adapt, publish, translate, create derivative works from, distribute, and display such content throughout
              the world in any media.
            </p>
            
            <p>
              You represent and warrant that your content does not violate any third-party rights, including privacy, publicity,
              copyright, trademark, or other intellectual property rights, and that it complies with these Terms and all applicable
              laws and regulations.
            </p>
            
            <h3>10. Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BELDIFY, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT
              LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE
              OF OR INABILITY TO ACCESS OR USE THE SERVICES.
            </p>
            
            <h3>11. Disclaimer of Warranties</h3>
            <p>
              THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS
              OR IMPLIED. BELDIFY DISCLAIMS ALL WARRANTIES, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            
            <h3>12. Indemnification</h3>
            <p>
              You agree to indemnify, defend, and hold harmless Beldify, its affiliates, officers, directors, employees, agents,
              licensors, and suppliers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses,
              or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use
              of the Services.
            </p>
            
            <h3>13. Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Morocco, without regard to its conflict
              of law provisions. Any legal action or proceeding arising out of or relating to these Terms shall be brought exclusively
              in the courts located in Morocco.
            </p>
            
            <h3>14. Changes to These Terms</h3>
            <p>
              We reserve the right to modify these Terms at any time. When we make changes, we will update the "Last updated" date
              at the top of these Terms and, in some cases, provide additional notice. Your continued use of our Services after we
              post modifications to the Terms constitutes your acceptance of those changes.
            </p>
            
            <h3>15. Termination</h3>
            <p>
              We may terminate or suspend your account and access to our Services immediately, without prior notice or liability,
              for any reason, including, without limitation, if you breach these Terms. Upon termination, your right to use the
              Services will immediately cease.
            </p>
            
            <h3>16. Contact Information</h3>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <address>
              <p>Email: legal@beldify.com</p>
              <p>Phone: +212 (0) 7 08 15 03 51</p>
              <p>Postal Address: 123 Medina Street, Tetouan, Morocco</p>
            </address>
          </div>
          
          <div className="mt-8 md:mt-12 rounded-md bg-indigo-50 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex">
                <DocumentTextIcon className="h-5 w-5 md:h-6 md:w-6 text-indigo-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-base md:text-lg font-medium text-indigo-900">{t('pages.termsOfService.legalAssistance')}</h3>
                  <p className="mt-1 md:mt-2 text-xs md:text-sm text-indigo-700">
                    {t('pages.termsOfService.clarification')}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:ml-6 md:mt-0">
                <a
                  href="/contact"
                  className="inline-flex w-full md:w-auto justify-center items-center rounded-md border border-transparent bg-indigo-600 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {t('pages.privacyPolicy.contactUs')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
