import React, { useState, useEffect } from 'react';
import {
  reactExtension,
  Select,
  useApplyShippingAddressChange,
  useShippingAddress,
  useExtensionCapability,
  useBuyerJourneyIntercept,
  useApplyAttributeChange
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.delivery-address.render-before',
  () => <Extension />,
);

function Extension() {
  const { countryCode } = useShippingAddress();
  const { city } = useShippingAddress();
  const applyShippingAddressChange = useApplyShippingAddressChange();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [validationError, setValidationError] = useState('');

  const canBlockProgress = useExtensionCapability("block_progress");
  const applyAttributeChange =useApplyAttributeChange();
  useEffect(() => {
    if (countryCode) {
      fetchCitiesByCountry(countryCode);
    }
  }, [countryCode]);

  const fetchCitiesByCountry = async (countryCode) => {
    try {
      const response = await fetch(`https://proptrend.hostingduty.com/proptrends_api/TestApi/cities.php?country_code=${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCities(data.cities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    }
  };

  const handleCityChange = async (value) => {
    setSelectedCity(value);
    clearValidationErrors();
    applyShippingAddressChange({
      type: 'updateShippingAddress',
      address: {
        city: value,
      },  
    });
    // Apply readonly only if a city is selected
    applyAttributeChange({
        type: 'updateAttribute',
        key: 'countryCode',
        value: {
          readonly: true,
        },
      });
  };

  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (canBlockProgress) {
      if(!isCitySet()  || !isCityMatch()){
      console.log(isCityMatch());
      return {
        behavior: "block",
        reason: "City is required",
        perform: (result) => {
          if (result.behavior === "block") {
            setValidationError("Please select your city");
          }
        },
      };
    }
    }
    return {
      behavior: "allow",
      perform: () => {
        clearValidationErrors();
      },
    };
  });

  function isCitySet() {
    return selectedCity !== '';
  }

  function isCity() {
    return city !== '';
  }

  function isCityMatch() {
    return city === selectedCity;
  }

  function clearValidationErrors() {
    setValidationError('');
  }

  return (
    <Select
      label="City"
      options={[
        { value: '', label: 'Select' },
        ...cities.map(city => ({ value: city, label: city })),
      ]}
      onChange={handleCityChange}
      value={selectedCity}
      required={canBlockProgress}
      error={validationError}
    />
  );
}