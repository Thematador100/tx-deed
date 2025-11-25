"""
AI-powered data extraction utilities
Uses LLMs to intelligently extract property data from various formats
"""
import os
from typing import Dict, Optional
from loguru import logger
from dotenv import load_dotenv
import anthropic
import openai

load_dotenv()


class AIDataExtractor:
    """
    Uses AI to extract structured property data from unstructured sources
    Useful for websites with complex layouts or inconsistent data formats
    """

    def __init__(self, provider: str = "anthropic"):
        """
        Initialize AI extractor

        Args:
            provider: 'anthropic' or 'openai'
        """
        self.provider = provider

        if provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if api_key:
                self.client = anthropic.Anthropic(api_key=api_key)
            else:
                logger.warning("Anthropic API key not found")
                self.client = None

        elif provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.client = openai.OpenAI(api_key=api_key)
            else:
                logger.warning("OpenAI API key not found")
                self.client = None

        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def extract_property_data(self, raw_text: str) -> Optional[Dict]:
        """
        Extract structured property data from raw text using AI

        Args:
            raw_text: Unstructured text containing property information

        Returns:
            Dictionary with extracted property data or None
        """
        if not self.client:
            logger.error("AI client not initialized")
            return None

        prompt = f"""
Extract property information from the following text and return it as a structured JSON object.

Required fields (use null if not found):
- address: Full property address
- city: City name
- county: County name
- zip_code: ZIP code
- appraised_value: Appraised or assessed value (number only)
- taxes_owed: Amount of taxes owed (number only)
- minimum_bid: Minimum bid amount (number only)
- sale_date: Date of sale (ISO format YYYY-MM-DD)
- property_type: One of: Single Family, Multi Family, Condo, Townhouse, Land, Commercial, Industrial, Unknown
- bedrooms: Number of bedrooms (integer)
- bathrooms: Number of bathrooms (decimal)
- sqft: Square footage (integer)
- owner_name: Property owner name
- account_number: Tax account or parcel number
- case_number: Court case number if applicable

Text to extract from:
{raw_text}

Respond with ONLY valid JSON, no additional text or explanation.
"""

        try:
            if self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1024,
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }]
                )
                content = response.content[0].text

            elif self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{
                        "role": "user",
                        "content": prompt
                    }],
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content

            # Parse JSON response
            import json
            extracted_data = json.loads(content)

            logger.info(f"Successfully extracted property data using AI")
            return extracted_data

        except Exception as e:
            logger.error(f"Error extracting data with AI: {str(e)}")
            return None

    def extract_from_pdf(self, pdf_path: str) -> Optional[Dict]:
        """
        Extract property data from a PDF document

        Args:
            pdf_path: Path to PDF file

        Returns:
            Extracted property data dictionary
        """
        try:
            import PyPDF2

            # Read PDF
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""

                for page in pdf_reader.pages:
                    text += page.extract_text()

            # Use AI to extract structured data
            return self.extract_property_data(text)

        except Exception as e:
            logger.error(f"Error extracting from PDF: {str(e)}")
            return None

    def extract_from_image(self, image_path: str) -> Optional[Dict]:
        """
        Extract property data from an image using OCR + AI

        Args:
            image_path: Path to image file

        Returns:
            Extracted property data dictionary
        """
        try:
            import pytesseract
            from PIL import Image

            # Perform OCR
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image)

            # Use AI to extract structured data
            return self.extract_property_data(text)

        except Exception as e:
            logger.error(f"Error extracting from image: {str(e)}")
            return None


# Example usage
if __name__ == "__main__":
    extractor = AIDataExtractor(provider="anthropic")

    sample_text = """
    Property Address: 123 Main Street, Houston, TX 77001
    Owner: John Doe
    Account #: 0123456789
    Appraised Value: $250,000
    Taxes Owed: $15,234.50
    Sale Date: March 15, 2025
    Property Type: Single Family Residence
    Bedrooms: 3, Bathrooms: 2, Square Feet: 1,850
    """

    result = extractor.extract_property_data(sample_text)
    print(json.dumps(result, indent=2))
