import logging
from typing import Dict, Tuple

logger = logging.getLogger(__name__)

# Mapping of countries to their currency and common timezones
LOCALE_MAPPING = {
    # Europe
    'AT': ('EUR', 'Europe/Vienna'),      # Austria
    'BE': ('EUR', 'Europe/Brussels'),    # Belgium
    'BG': ('BGN', 'Europe/Sofia'),       # Bulgaria
    'HR': ('EUR', 'Europe/Zagreb'),      # Croatia
    'CY': ('EUR', 'Asia/Nicosia'),       # Cyprus
    'CZ': ('CZK', 'Europe/Prague'),      # Czech Republic
    'DK': ('DKK', 'Europe/Copenhagen'),  # Denmark
    'EE': ('EUR', 'Europe/Tallinn'),     # Estonia
    'FI': ('EUR', 'Europe/Helsinki'),    # Finland
    'FR': ('EUR', 'Europe/Paris'),       # France
    'DE': ('EUR', 'Europe/Berlin'),      # Germany
    'GR': ('EUR', 'Europe/Athens'),      # Greece
    'HU': ('HUF', 'Europe/Budapest'),    # Hungary
    'IE': ('EUR', 'Europe/Dublin'),      # Ireland
    'IT': ('EUR', 'Europe/Rome'),        # Italy
    'LV': ('EUR', 'Europe/Riga'),        # Latvia
    'LT': ('EUR', 'Europe/Vilnius'),     # Lithuania
    'LU': ('EUR', 'Europe/Luxembourg'),  # Luxembourg
    'MT': ('EUR', 'Europe/Malta'),       # Malta
    'NL': ('EUR', 'Europe/Amsterdam'),   # Netherlands
    'PL': ('PLN', 'Europe/Warsaw'),      # Poland
    'PT': ('EUR', 'Europe/Lisbon'),      # Portugal
    'RO': ('RON', 'Europe/Bucharest'),   # Romania
    'SK': ('EUR', 'Europe/Bratislava'),  # Slovakia
    'SI': ('EUR', 'Europe/Ljubljana'),   # Slovenia
    'ES': ('EUR', 'Europe/Madrid'),      # Spain
    'SE': ('SEK', 'Europe/Stockholm'),   # Sweden
    'CH': ('CHF', 'Europe/Zurich'),      # Switzerland
    'GB': ('GBP', 'Europe/London'),      # United Kingdom
    'NO': ('NOK', 'Europe/Oslo'),        # Norway
    'IS': ('ISK', 'Atlantic/Reykjavik'), # Iceland
    
    # North America
    'US': ('USD', 'America/New_York'),   # United States
    'CA': ('CAD', 'America/Toronto'),    # Canada
    'MX': ('MXN', 'America/Mexico_City'), # Mexico
    
    # Asia
    'JP': ('JPY', 'Asia/Tokyo'),         # Japan
    'CN': ('CNY', 'Asia/Shanghai'),      # China
    'IN': ('INR', 'Asia/Kolkata'),       # India
    'KR': ('KRW', 'Asia/Seoul'),         # South Korea
    'SG': ('SGD', 'Asia/Singapore'),     # Singapore
    'HK': ('HKD', 'Asia/Hong_Kong'),     # Hong Kong
    'TH': ('THB', 'Asia/Bangkok'),       # Thailand
    'MY': ('MYR', 'Asia/Kuala_Lumpur'),  # Malaysia
    'ID': ('IDR', 'Asia/Jakarta'),       # Indonesia
    'PH': ('PHP', 'Asia/Manila'),        # Philippines
    'VN': ('VND', 'Asia/Ho_Chi_Minh'),   # Vietnam
    'TR': ('TRY', 'Europe/Istanbul'),    # Turkey
    'IL': ('ILS', 'Asia/Jerusalem'),     # Israel
    'AE': ('AED', 'Asia/Dubai'),         # UAE
    'SA': ('SAR', 'Asia/Riyadh'),        # Saudi Arabia
    
    # Oceania
    'AU': ('AUD', 'Australia/Sydney'),   # Australia
    'NZ': ('NZD', 'Pacific/Auckland'),   # New Zealand
    
    # South America
    'BR': ('BRL', 'America/Sao_Paulo'),  # Brazil
    'AR': ('ARS', 'America/Buenos_Aires'), # Argentina
    'CL': ('CLP', 'America/Santiago'),   # Chile
    'CO': ('COP', 'America/Bogota'),     # Colombia
    'PE': ('PEN', 'America/Lima'),       # Peru
    'VE': ('VES', 'America/Caracas'),    # Venezuela
    
    # Africa
    'ZA': ('ZAR', 'Africa/Johannesburg'), # South Africa
    'EG': ('EGP', 'Africa/Cairo'),       # Egypt
    'NG': ('NGN', 'Africa/Lagos'),       # Nigeria
    'KE': ('KES', 'Africa/Nairobi'),     # Kenya
    'MA': ('MAD', 'Africa/Casablanca'),  # Morocco
}


def get_locale_from_accept_language(accept_language: str) -> Tuple[str, str]:
    """
    Parse Accept-Language header and determine timezone and currency.
    
    Args:
        accept_language: Accept-Language header value (e.g., "en-US,en;q=0.9,ru;q=0.8")
    
    Returns:
        Tuple of (currency_code, timezone_string)
    """
    if not accept_language:
        return ('USD', 'UTC')
    
    # Parse Accept-Language header
    # Format: "en-US,en;q=0.9,de;q=0.8"
    # We take the first (highest priority) locale
    try:
        # Split by comma and get first locale
        first_locale = accept_language.split(',')[0].strip()
        
        # Remove quality factor if present (e.g., "en-US;q=0.9" -> "en-US")
        locale = first_locale.split(';')[0].strip()
        
        # Extract country code (e.g., "en-US" -> "US", "de-DE" -> "DE")
        if '-' in locale:
            country_code = locale.split('-')[1].upper()
        elif '_' in locale:
            country_code = locale.split('_')[1].upper()
        else:
            # No country code, try to guess from language
            # en -> US, de -> DE, fr -> FR, etc.
            language = locale.lower()
            country_mapping = {
                'en': 'US',
                'de': 'DE',
                'fr': 'FR',
                'es': 'ES',
                'it': 'IT',
                'pt': 'PT',
                'ru': 'RU',
                'ja': 'JP',
                'zh': 'CN',
                'ko': 'KR',
                'ar': 'SA',
                'nl': 'NL',
                'pl': 'PL',
                'tr': 'TR',
            }
            country_code = country_mapping.get(language, 'US')
        
        # Look up currency and timezone
        if country_code in LOCALE_MAPPING:
            currency, timezone = LOCALE_MAPPING[country_code]
            logger.info(f"Detected locale from Accept-Language: {locale} -> {country_code} -> {currency}, {timezone}")
            return (currency, timezone)
        else:
            logger.warning(f"Country code {country_code} not found in mapping, using defaults")
            return ('USD', 'UTC')
            
    except Exception as e:
        logger.error(f"Error parsing Accept-Language header '{accept_language}': {e}")
        return ('USD', 'UTC')


def get_locale_from_request(request) -> Tuple[str, str]:
    """
    Determine user's locale (currency and timezone) from request headers.
    
    Tries multiple sources in order:
    1. Accept-Language header
    2. Browser timezone from custom header (if available)
    3. Defaults to USD and UTC
    
    Args:
        request: Django request object
    
    Returns:
        Tuple of (currency_code, timezone_string)
    """
    # Try Accept-Language header
    accept_language = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
    if accept_language:
        currency, timezone = get_locale_from_accept_language(accept_language)
        
        # Check if browser sent timezone via custom header
        browser_timezone = request.META.get('HTTP_X_TIMEZONE', '')
        if browser_timezone:
            # Validate that it's a reasonable timezone string
            if '/' in browser_timezone and len(browser_timezone) < 50:
                timezone = browser_timezone
                logger.info(f"Using browser-provided timezone: {timezone}")
        
        return (currency, timezone)
    
    # Fallback to defaults
    logger.info("No locale information available, using defaults")
    return ('USD', 'UTC')

