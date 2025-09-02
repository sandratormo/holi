#!/usr/bin/env python3
"""
adoptaunpana.es Backend API Test Suite
Tests all backend endpoints for the dog adoption platform
"""

import requests
import json
import uuid
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

class AdoptaunpanaAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.test_results = []
        self.created_dog_id = None
        self.created_message_id = None
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_root_endpoint(self):
        """Test GET /api - root endpoint"""
        try:
            response = requests.get(f"{self.base_url}", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == "adoptaunpana.es API":
                    self.log_result("Root Endpoint", True, "API root endpoint working correctly", data)
                    return True
                else:
                    self.log_result("Root Endpoint", False, f"Unexpected response message: {data}", data)
                    return False
            else:
                self.log_result("Root Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Root Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_database_setup(self):
        """Test POST /api/setup - database table creation"""
        try:
            response = requests.post(f"{self.base_url}/setup", headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if "setup completed successfully" in data.get('message', '').lower():
                    self.log_result("Database Setup", True, "Database tables created successfully", data)
                    return True
                else:
                    self.log_result("Database Setup", False, f"Unexpected setup response: {data}", data)
                    return False
            else:
                self.log_result("Database Setup", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Database Setup", False, f"Setup request failed: {str(e)}")
            return False
    
    def test_provinces_endpoint(self):
        """Test GET /api/provinces - fetch Spanish provinces"""
        try:
            response = requests.get(f"{self.base_url}/provinces", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check for expected Spanish provinces
                    province_names = [p.get('name', '') for p in data]
                    expected_provinces = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla']
                    found_provinces = [p for p in expected_provinces if p in province_names]
                    
                    if len(found_provinces) >= 2:  # At least 2 major provinces should exist
                        self.log_result("Provinces Endpoint", True, f"Found {len(data)} provinces including: {', '.join(found_provinces)}")
                        return True
                    else:
                        self.log_result("Provinces Endpoint", False, f"Missing expected Spanish provinces. Found: {province_names}")
                        return False
                else:
                    self.log_result("Provinces Endpoint", False, f"Expected array of provinces, got: {type(data)}")
                    return False
            else:
                self.log_result("Provinces Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Provinces Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_cities_endpoint(self):
        """Test GET /api/cities - fetch cities with province filtering"""
        try:
            # Test all cities
            response = requests.get(f"{self.base_url}/cities", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                all_cities = response.json()
                if isinstance(all_cities, list) and len(all_cities) > 0:
                    self.log_result("Cities Endpoint (All)", True, f"Found {len(all_cities)} cities")
                    
                    # Test filtering by province
                    if all_cities:
                        first_city = all_cities[0]
                        province_id = first_city.get('province_id')
                        if province_id:
                            filtered_response = requests.get(
                                f"{self.base_url}/cities?province={province_id}", 
                                headers=self.headers, 
                                timeout=10
                            )
                            
                            if filtered_response.status_code == 200:
                                filtered_cities = filtered_response.json()
                                if isinstance(filtered_cities, list):
                                    self.log_result("Cities Endpoint (Filtered)", True, 
                                                  f"Province filter working: {len(filtered_cities)} cities for province {province_id}")
                                    return True
                                else:
                                    self.log_result("Cities Endpoint (Filtered)", False, "Province filtering returned invalid data")
                                    return False
                            else:
                                self.log_result("Cities Endpoint (Filtered)", False, 
                                              f"Province filtering failed: HTTP {filtered_response.status_code}")
                                return False
                        else:
                            self.log_result("Cities Endpoint", False, "Cities missing province_id field")
                            return False
                    else:
                        self.log_result("Cities Endpoint", True, "Cities endpoint working (no cities to filter)")
                        return True
                else:
                    self.log_result("Cities Endpoint", False, f"Expected array of cities, got: {type(all_cities)}")
                    return False
            else:
                self.log_result("Cities Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Cities Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_create_dog_listing(self):
        """Test POST /api/dogs - create new dog listing"""
        try:
            # First get provinces and cities for valid IDs
            provinces_response = requests.get(f"{self.base_url}/provinces", headers=self.headers, timeout=10)
            if provinces_response.status_code != 200:
                self.log_result("Create Dog Listing", False, "Cannot get provinces for test data")
                return False
            
            provinces = provinces_response.json()
            if not provinces:
                self.log_result("Create Dog Listing", False, "No provinces available for test")
                return False
            
            province = provinces[0]
            cities_response = requests.get(f"{self.base_url}/cities?province={province['id']}", headers=self.headers, timeout=10)
            if cities_response.status_code != 200:
                self.log_result("Create Dog Listing", False, "Cannot get cities for test data")
                return False
            
            cities = cities_response.json()
            if not cities:
                self.log_result("Create Dog Listing", False, "No cities available for test")
                return False
            
            city = cities[0]
            
            # Create test dog listing
            test_dog = {
                "title": "Perro Adorable Busca Hogar",
                "dogName": "Luna",
                "description": "Luna es una perra muy cariñosa que busca una familia amorosa. Es muy buena con niños y otros animales.",
                "age": 24,  # 2 years in months
                "size": "mediano",
                "gender": "hembra",
                "breed": "Mestizo",
                "isUrgent": True,
                "isVaccinated": True,
                "isNeutered": True,
                "contactName": "María García",
                "contactEmail": "maria.garcia@example.com",
                "contactPhone": "+34 600 123 456",
                "province": province['id'],
                "city": city['id'],
                "imageUrls": ["https://example.com/dog1.jpg", "https://example.com/dog2.jpg"]
            }
            
            response = requests.post(f"{self.base_url}/dogs", 
                                   headers=self.headers, 
                                   json=test_dog, 
                                   timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('id') and data.get('dogName') == 'Luna':
                    self.created_dog_id = data['id']
                    self.log_result("Create Dog Listing", True, f"Dog listing created successfully with ID: {self.created_dog_id}")
                    return True
                else:
                    self.log_result("Create Dog Listing", False, f"Invalid response data: {data}")
                    return False
            else:
                self.log_result("Create Dog Listing", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Create Dog Listing", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_dog_listings(self):
        """Test GET /api/dogs - fetch dog listings with filters"""
        try:
            # Test getting all dogs
            response = requests.get(f"{self.base_url}/dogs", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                all_dogs = response.json()
                if isinstance(all_dogs, list):
                    self.log_result("Get Dog Listings (All)", True, f"Found {len(all_dogs)} dog listings")
                    
                    # Test filtering by size
                    size_response = requests.get(f"{self.base_url}/dogs?size=mediano", headers=self.headers, timeout=10)
                    if size_response.status_code == 200:
                        size_filtered = size_response.json()
                        self.log_result("Get Dog Listings (Size Filter)", True, 
                                      f"Size filter working: {len(size_filtered)} medium dogs")
                        
                        # Test filtering by gender
                        gender_response = requests.get(f"{self.base_url}/dogs?gender=hembra", headers=self.headers, timeout=10)
                        if gender_response.status_code == 200:
                            gender_filtered = gender_response.json()
                            self.log_result("Get Dog Listings (Gender Filter)", True, 
                                          f"Gender filter working: {len(gender_filtered)} female dogs")
                            
                            # Test urgent filter
                            urgent_response = requests.get(f"{self.base_url}/dogs?urgent=true", headers=self.headers, timeout=10)
                            if urgent_response.status_code == 200:
                                urgent_filtered = urgent_response.json()
                                self.log_result("Get Dog Listings (Urgent Filter)", True, 
                                              f"Urgent filter working: {len(urgent_filtered)} urgent dogs")
                                return True
                            else:
                                self.log_result("Get Dog Listings (Urgent Filter)", False, 
                                              f"Urgent filter failed: HTTP {urgent_response.status_code}")
                                return False
                        else:
                            self.log_result("Get Dog Listings (Gender Filter)", False, 
                                          f"Gender filter failed: HTTP {gender_response.status_code}")
                            return False
                    else:
                        self.log_result("Get Dog Listings (Size Filter)", False, 
                                      f"Size filter failed: HTTP {size_response.status_code}")
                        return False
                else:
                    self.log_result("Get Dog Listings", False, f"Expected array, got: {type(all_dogs)}")
                    return False
            else:
                self.log_result("Get Dog Listings", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Get Dog Listings", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_single_dog(self):
        """Test GET /api/dogs/{id} - get single dog listing"""
        if not self.created_dog_id:
            self.log_result("Get Single Dog", False, "No dog ID available for testing")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/dogs/{self.created_dog_id}", 
                                  headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('id') == self.created_dog_id and data.get('dogName') == 'Luna':
                    self.log_result("Get Single Dog", True, f"Successfully retrieved dog: {data['dogName']}")
                    return True
                else:
                    self.log_result("Get Single Dog", False, f"Invalid dog data: {data}")
                    return False
            else:
                self.log_result("Get Single Dog", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Get Single Dog", False, f"Request failed: {str(e)}")
            return False
    
    def test_send_message(self):
        """Test POST /api/messages - send contact messages"""
        if not self.created_dog_id:
            self.log_result("Send Message", False, "No dog ID available for testing")
            return False
        
        try:
            test_message = {
                "listing_id": self.created_dog_id,
                "senderName": "Carlos Rodríguez",
                "senderEmail": "carlos.rodriguez@example.com",
                "senderPhone": "+34 600 987 654",
                "message": "Hola, estoy muy interesado en adoptar a Luna. ¿Podríamos hablar por teléfono? Tengo experiencia con perros y un jardín grande."
            }
            
            response = requests.post(f"{self.base_url}/messages", 
                                   headers=self.headers, 
                                   json=test_message, 
                                   timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('id') and data.get('senderName') == 'Carlos Rodríguez':
                    self.created_message_id = data['id']
                    self.log_result("Send Message", True, f"Message sent successfully with ID: {self.created_message_id}")
                    return True
                else:
                    self.log_result("Send Message", False, f"Invalid message response: {data}")
                    return False
            else:
                self.log_result("Send Message", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Send Message", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_messages(self):
        """Test GET /api/messages - fetch messages"""
        try:
            # Test getting all messages
            response = requests.get(f"{self.base_url}/messages", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                all_messages = response.json()
                if isinstance(all_messages, list):
                    self.log_result("Get Messages (All)", True, f"Found {len(all_messages)} messages")
                    
                    # Test filtering by listing_id if we have a dog
                    if self.created_dog_id:
                        filtered_response = requests.get(
                            f"{self.base_url}/messages?listing_id={self.created_dog_id}", 
                            headers=self.headers, timeout=10
                        )
                        
                        if filtered_response.status_code == 200:
                            filtered_messages = filtered_response.json()
                            self.log_result("Get Messages (Filtered)", True, 
                                          f"Listing filter working: {len(filtered_messages)} messages for dog")
                            return True
                        else:
                            self.log_result("Get Messages (Filtered)", False, 
                                          f"Message filtering failed: HTTP {filtered_response.status_code}")
                            return False
                    else:
                        return True
                else:
                    self.log_result("Get Messages", False, f"Expected array, got: {type(all_messages)}")
                    return False
            else:
                self.log_result("Get Messages", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Get Messages", False, f"Request failed: {str(e)}")
            return False
    
    def test_search_functionality(self):
        """Test GET /api/search - search functionality"""
        try:
            # Test text search
            search_response = requests.get(f"{self.base_url}/search?q=Luna", headers=self.headers, timeout=10)
            
            if search_response.status_code == 200:
                search_results = search_response.json()
                if isinstance(search_results, list):
                    self.log_result("Search Functionality (Text)", True, 
                                  f"Text search working: {len(search_results)} results for 'Luna'")
                    
                    # Test search with filters
                    filtered_search = requests.get(f"{self.base_url}/search?q=Luna&size=mediano&gender=hembra", 
                                                 headers=self.headers, timeout=10)
                    
                    if filtered_search.status_code == 200:
                        filtered_results = filtered_search.json()
                        self.log_result("Search Functionality (Filtered)", True, 
                                      f"Filtered search working: {len(filtered_results)} results")
                        return True
                    else:
                        self.log_result("Search Functionality (Filtered)", False, 
                                      f"Filtered search failed: HTTP {filtered_search.status_code}")
                        return False
                else:
                    self.log_result("Search Functionality", False, f"Expected array, got: {type(search_results)}")
                    return False
            else:
                self.log_result("Search Functionality", False, f"HTTP {search_response.status_code}: {search_response.text}")
                return False
                
        except Exception as e:
            self.log_result("Search Functionality", False, f"Request failed: {str(e)}")
            return False
    
    def test_stats_endpoint(self):
        """Test GET /api/stats - platform statistics"""
        try:
            response = requests.get(f"{self.base_url}/stats", headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ['totalDogs', 'urgentDogs', 'totalMessages', 'dogsByProvince']
                
                if all(field in data for field in expected_fields):
                    stats_info = f"Dogs: {data['totalDogs']}, Urgent: {data['urgentDogs']}, Messages: {data['totalMessages']}"
                    self.log_result("Stats Endpoint", True, f"Statistics working correctly - {stats_info}")
                    return True
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_result("Stats Endpoint", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_result("Stats Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Stats Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test error handling for missing fields"""
        try:
            # Test creating dog with missing required fields
            invalid_dog = {
                "title": "Test Dog",
                # Missing required fields intentionally
            }
            
            response = requests.post(f"{self.base_url}/dogs", 
                                   headers=self.headers, 
                                   json=invalid_dog, 
                                   timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Missing required field' in data['error']:
                    self.log_result("Error Handling", True, "Validation errors handled correctly")
                    return True
                else:
                    self.log_result("Error Handling", False, f"Unexpected error response: {data}")
                    return False
            else:
                self.log_result("Error Handling", False, f"Expected 400 error, got: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Error Handling", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🐕 Starting adoptaunpana.es Backend API Tests")
        print("=" * 60)
        
        tests = [
            self.test_root_endpoint,
            self.test_database_setup,
            self.test_provinces_endpoint,
            self.test_cities_endpoint,
            self.test_create_dog_listing,
            self.test_get_dog_listings,
            self.test_get_single_dog,
            self.test_send_message,
            self.test_get_messages,
            self.test_search_functionality,
            self.test_stats_endpoint,
            self.test_error_handling
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL: {test.__name__} - Unexpected error: {str(e)}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        print("\n" + "=" * 60)
        print(f"🐕 adoptaunpana.es Backend API Test Results")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("🎉 All tests passed! Backend API is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        return passed, failed, self.test_results

if __name__ == "__main__":
    tester = AdoptaunpanaAPITester()
    passed, failed, results = tester.run_all_tests()
    
    # Save detailed results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'passed': passed,
                'failed': failed,
                'success_rate': passed/(passed+failed)*100 if (passed+failed) > 0 else 0
            },
            'detailed_results': results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")