import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { Worker } from '@/shared/types';

// Enable mock data for testing (set to false to use real API)
const USE_MOCK_DATA = false;

// Mock worker data for testing UI - distributed across major cities
// Note: townId format matches city search: cityname-district-state (all lowercase, spaces replaced with hyphens)
const MOCK_WORKERS: Worker[] = [
  // Howrah workers (Howrah is an actual location in the data)
  {
    workerId: 'howrah-1',
    name: 'Subhash Mondal',
    mobile: '9876543210',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'howrah-howrah-west-bengal',
    townName: 'Howrah',
    tehsilName: 'Howrah',
    districtName: 'Howrah',
    stateName: 'West Bengal',
    pinCode: '711101',
    experienceYears: 8,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 150,
    avgRating: 4.5,
    reviewCount: 32,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'howrah-2',
    name: 'Biswajit Das',
    mobile: '9876543211',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'howrah-howrah-west-bengal',
    townName: 'Howrah',
    tehsilName: 'Howrah',
    districtName: 'Howrah',
    stateName: 'West Bengal',
    pinCode: '711101',
    experienceYears: 12,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 5,
    hasWorkVideo: true,
    viewCount: 230,
    avgRating: 4.8,
    reviewCount: 56,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'howrah-3',
    name: 'Arun Ghosh',
    mobile: '9876543212',
    categoryId: 'carpenter',
    categoryName: 'Carpenter',
    townId: 'howrah-howrah-west-bengal',
    townName: 'Howrah',
    tehsilName: 'Howrah',
    districtName: 'Howrah',
    stateName: 'West Bengal',
    pinCode: '711101',
    experienceYears: 10,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 178,
    avgRating: 4.6,
    reviewCount: 41,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Bangalore workers
  {
    workerId: 'bangalore-1',
    name: 'Ramesh Gowda',
    mobile: '9876543213',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'bangalore-bangalore-urban-karnataka',
    townName: 'Bangalore',
    tehsilName: 'Bangalore South',
    districtName: 'Bangalore Urban',
    stateName: 'Karnataka',
    pinCode: '560001',
    experienceYears: 6,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 2,
    hasWorkVideo: true,
    viewCount: 120,
    avgRating: 4.3,
    reviewCount: 28,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'bangalore-2',
    name: 'Venkatesh Reddy',
    mobile: '9876543214',
    categoryId: 'ac-repair',
    categoryName: 'AC Repair',
    townId: 'bangalore-bangalore-urban-karnataka',
    townName: 'Bangalore',
    tehsilName: 'Bangalore North',
    districtName: 'Bangalore Urban',
    stateName: 'Karnataka',
    pinCode: '560045',
    experienceYears: 9,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 245,
    avgRating: 4.7,
    reviewCount: 52,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'bangalore-3',
    name: 'Srinivas Kumar',
    mobile: '9876543215',
    categoryId: 'painter',
    categoryName: 'Painter',
    townId: 'bangalore-bangalore-urban-karnataka',
    townName: 'Bangalore',
    tehsilName: 'Bangalore East',
    districtName: 'Bangalore Urban',
    stateName: 'Karnataka',
    pinCode: '560038',
    experienceYears: 7,
    isAvailable: false,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 98,
    avgRating: 4.4,
    reviewCount: 24,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Delhi workers
  {
    workerId: 'delhi-1',
    name: 'Rajesh Sharma',
    mobile: '9876543216',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'delhi-new-delhi-delhi',
    townName: 'Delhi',
    tehsilName: 'Central Delhi',
    districtName: 'New Delhi',
    stateName: 'Delhi',
    pinCode: '110001',
    experienceYears: 15,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 5,
    hasWorkVideo: true,
    viewCount: 320,
    avgRating: 4.9,
    reviewCount: 78,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'delhi-2',
    name: 'Vikram Singh',
    mobile: '9876543217',
    categoryId: 'raj-mistry',
    categoryName: 'Raj Mistry',
    townId: 'delhi-new-delhi-delhi',
    townName: 'Delhi',
    tehsilName: 'South Delhi',
    districtName: 'New Delhi',
    stateName: 'Delhi',
    pinCode: '110024',
    experienceYears: 18,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 5,
    hasWorkVideo: true,
    viewCount: 412,
    avgRating: 4.8,
    reviewCount: 95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'delhi-3',
    name: 'Amit Verma',
    mobile: '9876543218',
    categoryId: 'welder',
    categoryName: 'Welder',
    townId: 'delhi-new-delhi-delhi',
    townName: 'Delhi',
    tehsilName: 'West Delhi',
    districtName: 'New Delhi',
    stateName: 'Delhi',
    pinCode: '110018',
    experienceYears: 11,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 156,
    avgRating: 4.5,
    reviewCount: 38,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Mumbai workers
  {
    workerId: 'mumbai-1',
    name: 'Ganesh Patil',
    mobile: '9876543219',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'mumbai-mumbai-maharashtra',
    townName: 'Mumbai',
    tehsilName: 'Mumbai City',
    districtName: 'Mumbai',
    stateName: 'Maharashtra',
    pinCode: '400001',
    experienceYears: 9,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 210,
    avgRating: 4.6,
    reviewCount: 48,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mumbai-2',
    name: 'Santosh Jadhav',
    mobile: '9876543220',
    categoryId: 'carpenter',
    categoryName: 'Carpenter',
    townId: 'mumbai-mumbai-maharashtra',
    townName: 'Mumbai',
    tehsilName: 'Mumbai Suburban',
    districtName: 'Mumbai',
    stateName: 'Maharashtra',
    pinCode: '400050',
    experienceYears: 14,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 5,
    hasWorkVideo: true,
    viewCount: 287,
    avgRating: 4.7,
    reviewCount: 65,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mumbai-3',
    name: 'Prakash Deshmukh',
    mobile: '9876543221',
    categoryId: 'bike-service',
    categoryName: 'Bike Service',
    townId: 'mumbai-mumbai-maharashtra',
    townName: 'Mumbai',
    tehsilName: 'Andheri',
    districtName: 'Mumbai',
    stateName: 'Maharashtra',
    pinCode: '400069',
    experienceYears: 5,
    isAvailable: false,
    isVerified: false,
    hasProfilePhoto: true,
    workPhotoCount: 2,
    hasWorkVideo: false,
    viewCount: 89,
    avgRating: 4.2,
    reviewCount: 19,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Chennai workers
  {
    workerId: 'chennai-1',
    name: 'Murugan Krishnan',
    mobile: '9876543222',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'chennai-chennai-tamil-nadu',
    townName: 'Chennai',
    tehsilName: 'Chennai Central',
    districtName: 'Chennai',
    stateName: 'Tamil Nadu',
    pinCode: '600001',
    experienceYears: 10,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 195,
    avgRating: 4.5,
    reviewCount: 42,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'chennai-2',
    name: 'Selvam Rajan',
    mobile: '9876543223',
    categoryId: 'painter',
    categoryName: 'Painter',
    townId: 'chennai-chennai-tamil-nadu',
    townName: 'Chennai',
    tehsilName: 'T. Nagar',
    districtName: 'Chennai',
    stateName: 'Tamil Nadu',
    pinCode: '600017',
    experienceYears: 8,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 134,
    avgRating: 4.4,
    reviewCount: 31,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'chennai-3',
    name: 'Arun Balaji',
    mobile: '9876543224',
    categoryId: 'ac-repair',
    categoryName: 'AC Repair',
    townId: 'chennai-chennai-tamil-nadu',
    townName: 'Chennai',
    tehsilName: 'Adyar',
    districtName: 'Chennai',
    stateName: 'Tamil Nadu',
    pinCode: '600020',
    experienceYears: 7,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 167,
    avgRating: 4.6,
    reviewCount: 37,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Kolkata workers (West Bengal)
  {
    workerId: 'kolkata-1',
    name: 'Dipak Banerjee',
    mobile: '9876543225',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'kolkata-kolkata-west-bengal',
    townName: 'Kolkata',
    tehsilName: 'Kolkata Central',
    districtName: 'Kolkata',
    stateName: 'West Bengal',
    pinCode: '700001',
    experienceYears: 14,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 5,
    hasWorkVideo: true,
    viewCount: 298,
    avgRating: 4.8,
    reviewCount: 67,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'kolkata-2',
    name: 'Ratan Chakraborty',
    mobile: '9876543226',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'kolkata-kolkata-west-bengal',
    townName: 'Kolkata',
    tehsilName: 'Salt Lake',
    districtName: 'Kolkata',
    stateName: 'West Bengal',
    pinCode: '700091',
    experienceYears: 9,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 186,
    avgRating: 4.5,
    reviewCount: 43,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'kolkata-3',
    name: 'Manoj Mukherjee',
    mobile: '9876543227',
    categoryId: 'painter',
    categoryName: 'Painter',
    townId: 'kolkata-kolkata-west-bengal',
    townName: 'Kolkata',
    tehsilName: 'Park Street',
    districtName: 'Kolkata',
    stateName: 'West Bengal',
    pinCode: '700016',
    experienceYears: 11,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 212,
    avgRating: 4.6,
    reviewCount: 51,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'kolkata-4',
    name: 'Samir Roy',
    mobile: '9876543228',
    categoryId: 'ac-repair',
    categoryName: 'AC Repair',
    townId: 'kolkata-kolkata-west-bengal',
    townName: 'Kolkata',
    tehsilName: 'New Town',
    districtName: 'Kolkata',
    stateName: 'West Bengal',
    pinCode: '700156',
    experienceYears: 6,
    isAvailable: false,
    isVerified: false,
    hasProfilePhoto: true,
    workPhotoCount: 2,
    hasWorkVideo: false,
    viewCount: 134,
    avgRating: 4.3,
    reviewCount: 29,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Hyderabad workers (Telangana)
  {
    workerId: 'hyderabad-1',
    name: 'Venkat Rao',
    mobile: '9876543229',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'hyderabad-hyderabad-telangana',
    townName: 'Hyderabad',
    tehsilName: 'Secunderabad',
    districtName: 'Hyderabad',
    stateName: 'Telangana',
    pinCode: '500003',
    experienceYears: 16,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 5,
    hasWorkVideo: true,
    viewCount: 356,
    avgRating: 4.9,
    reviewCount: 89,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'hyderabad-2',
    name: 'Krishna Reddy',
    mobile: '9876543230',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'hyderabad-hyderabad-telangana',
    townName: 'Hyderabad',
    tehsilName: 'Banjara Hills',
    districtName: 'Hyderabad',
    stateName: 'Telangana',
    pinCode: '500034',
    experienceYears: 8,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 198,
    avgRating: 4.5,
    reviewCount: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'hyderabad-3',
    name: 'Ravi Kumar',
    mobile: '9876543231',
    categoryId: 'carpenter',
    categoryName: 'Carpenter',
    townId: 'hyderabad-hyderabad-telangana',
    townName: 'Hyderabad',
    tehsilName: 'HITEC City',
    districtName: 'Hyderabad',
    stateName: 'Telangana',
    pinCode: '500081',
    experienceYears: 12,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 267,
    avgRating: 4.7,
    reviewCount: 62,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'hyderabad-4',
    name: 'Suresh Naidu',
    mobile: '9876543232',
    categoryId: 'washing-machine',
    categoryName: 'Washing Machine',
    townId: 'hyderabad-hyderabad-telangana',
    townName: 'Hyderabad',
    tehsilName: 'Gachibowli',
    districtName: 'Hyderabad',
    stateName: 'Telangana',
    pinCode: '500032',
    experienceYears: 5,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 2,
    hasWorkVideo: true,
    viewCount: 112,
    avgRating: 4.4,
    reviewCount: 26,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Pune workers (Maharashtra)
  {
    workerId: 'pune-1',
    name: 'Sachin Kulkarni',
    mobile: '9876543233',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'pune-pune-maharashtra',
    townName: 'Pune',
    tehsilName: 'Shivaji Nagar',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    pinCode: '411005',
    experienceYears: 13,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 278,
    avgRating: 4.7,
    reviewCount: 64,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'pune-2',
    name: 'Ajay Pawar',
    mobile: '9876543234',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'pune-pune-maharashtra',
    townName: 'Pune',
    tehsilName: 'Kothrud',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    pinCode: '411038',
    experienceYears: 7,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 156,
    avgRating: 4.4,
    reviewCount: 35,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'pune-3',
    name: 'Rahul Joshi',
    mobile: '9876543235',
    categoryId: 'ac-repair',
    categoryName: 'AC Repair',
    townId: 'pune-pune-maharashtra',
    townName: 'Pune',
    tehsilName: 'Hadapsar',
    districtName: 'Pune',
    stateName: 'Maharashtra',
    pinCode: '411028',
    experienceYears: 8,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 189,
    avgRating: 4.6,
    reviewCount: 42,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Jaipur workers (Rajasthan)
  {
    workerId: 'jaipur-1',
    name: 'Mahesh Sharma',
    mobile: '9876543236',
    categoryId: 'raj-mistry',
    categoryName: 'Raj Mistry',
    townId: 'jaipur-jaipur-rajasthan',
    townName: 'Jaipur',
    tehsilName: 'Pink City',
    districtName: 'Jaipur',
    stateName: 'Rajasthan',
    pinCode: '302001',
    experienceYears: 20,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 5,
    hasWorkVideo: true,
    viewCount: 456,
    avgRating: 4.9,
    reviewCount: 112,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'jaipur-2',
    name: 'Ramesh Meena',
    mobile: '9876543237',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'jaipur-jaipur-rajasthan',
    townName: 'Jaipur',
    tehsilName: 'Malviya Nagar',
    districtName: 'Jaipur',
    stateName: 'Rajasthan',
    pinCode: '302017',
    experienceYears: 10,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 234,
    avgRating: 4.6,
    reviewCount: 54,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'jaipur-3',
    name: 'Kailash Gupta',
    mobile: '9876543238',
    categoryId: 'painter',
    categoryName: 'Painter',
    townId: 'jaipur-jaipur-rajasthan',
    townName: 'Jaipur',
    tehsilName: 'Vaishali Nagar',
    districtName: 'Jaipur',
    stateName: 'Rajasthan',
    pinCode: '302021',
    experienceYears: 9,
    isAvailable: false,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 167,
    avgRating: 4.5,
    reviewCount: 38,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Ahmedabad workers (Gujarat)
  {
    workerId: 'ahmedabad-1',
    name: 'Jayesh Patel',
    mobile: '9876543239',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'ahmedabad-ahmedabad-gujarat',
    townName: 'Ahmedabad',
    tehsilName: 'Navrangpura',
    districtName: 'Ahmedabad',
    stateName: 'Gujarat',
    pinCode: '380009',
    experienceYears: 11,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 245,
    avgRating: 4.6,
    reviewCount: 57,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'ahmedabad-2',
    name: 'Hitesh Shah',
    mobile: '9876543240',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'ahmedabad-ahmedabad-gujarat',
    townName: 'Ahmedabad',
    tehsilName: 'Satellite',
    districtName: 'Ahmedabad',
    stateName: 'Gujarat',
    pinCode: '380015',
    experienceYears: 15,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 5,
    hasWorkVideo: true,
    viewCount: 312,
    avgRating: 4.8,
    reviewCount: 73,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'ahmedabad-3',
    name: 'Nikhil Desai',
    mobile: '9876543241',
    categoryId: 'carpenter',
    categoryName: 'Carpenter',
    townId: 'ahmedabad-ahmedabad-gujarat',
    townName: 'Ahmedabad',
    tehsilName: 'Prahlad Nagar',
    districtName: 'Ahmedabad',
    stateName: 'Gujarat',
    pinCode: '380015',
    experienceYears: 8,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 178,
    avgRating: 4.5,
    reviewCount: 41,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'ahmedabad-4',
    name: 'Sunil Modi',
    mobile: '9876543242',
    categoryId: 'cycle-repair',
    categoryName: 'Cycle Repair',
    townId: 'ahmedabad-ahmedabad-gujarat',
    townName: 'Ahmedabad',
    tehsilName: 'Maninagar',
    districtName: 'Ahmedabad',
    stateName: 'Gujarat',
    pinCode: '380008',
    experienceYears: 12,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 2,
    hasWorkVideo: true,
    viewCount: 145,
    avgRating: 4.4,
    reviewCount: 33,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Lucknow workers (Uttar Pradesh)
  {
    workerId: 'lucknow-1',
    name: 'Anil Tripathi',
    mobile: '9876543243',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'lucknow-lucknow-uttar-pradesh',
    townName: 'Lucknow',
    tehsilName: 'Hazratganj',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    pinCode: '226001',
    experienceYears: 12,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 267,
    avgRating: 4.7,
    reviewCount: 61,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'lucknow-2',
    name: 'Vijay Pandey',
    mobile: '9876543244',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'lucknow-lucknow-uttar-pradesh',
    townName: 'Lucknow',
    tehsilName: 'Gomti Nagar',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    pinCode: '226010',
    experienceYears: 9,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 189,
    avgRating: 4.5,
    reviewCount: 44,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'lucknow-3',
    name: 'Sanjay Mishra',
    mobile: '9876543245',
    categoryId: 'welder',
    categoryName: 'Welder',
    townId: 'lucknow-lucknow-uttar-pradesh',
    townName: 'Lucknow',
    tehsilName: 'Aliganj',
    districtName: 'Lucknow',
    stateName: 'Uttar Pradesh',
    pinCode: '226024',
    experienceYears: 14,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 198,
    avgRating: 4.6,
    reviewCount: 47,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Additional workers in existing cities for variety
  // Delhi additional
  {
    workerId: 'delhi-4',
    name: 'Pankaj Gupta',
    mobile: '9876543246',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    townId: 'delhi-new-delhi-delhi',
    townName: 'Delhi',
    tehsilName: 'Karol Bagh',
    districtName: 'New Delhi',
    stateName: 'Delhi',
    pinCode: '110005',
    experienceYears: 10,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 234,
    avgRating: 4.6,
    reviewCount: 53,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'delhi-5',
    name: 'Rohit Tiwari',
    mobile: '9876543247',
    categoryId: 'ac-repair',
    categoryName: 'AC Repair',
    townId: 'delhi-new-delhi-delhi',
    townName: 'Delhi',
    tehsilName: 'Dwarka',
    districtName: 'New Delhi',
    stateName: 'Delhi',
    pinCode: '110075',
    experienceYears: 7,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 187,
    avgRating: 4.5,
    reviewCount: 42,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Mumbai additional
  {
    workerId: 'mumbai-4',
    name: 'Ashok Sawant',
    mobile: '9876543248',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'mumbai-mumbai-maharashtra',
    townName: 'Mumbai',
    tehsilName: 'Dadar',
    districtName: 'Mumbai',
    stateName: 'Maharashtra',
    pinCode: '400014',
    experienceYears: 16,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 5,
    hasWorkVideo: true,
    viewCount: 345,
    avgRating: 4.8,
    reviewCount: 82,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'mumbai-5',
    name: 'Dinesh Thakur',
    mobile: '9876543249',
    categoryId: 'painter',
    categoryName: 'Painter',
    townId: 'mumbai-mumbai-maharashtra',
    townName: 'Mumbai',
    tehsilName: 'Bandra',
    districtName: 'Mumbai',
    stateName: 'Maharashtra',
    pinCode: '400050',
    experienceYears: 11,
    isAvailable: false,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 223,
    avgRating: 4.6,
    reviewCount: 51,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Bangalore additional
  {
    workerId: 'bangalore-4',
    name: 'Naveen Gowda',
    mobile: '9876543250',
    categoryId: 'electrician',
    categoryName: 'Electrician',
    townId: 'bangalore-bangalore-urban-karnataka',
    townName: 'Bangalore',
    tehsilName: 'Koramangala',
    districtName: 'Bangalore Urban',
    stateName: 'Karnataka',
    pinCode: '560034',
    experienceYears: 8,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 3,
    hasWorkVideo: true,
    viewCount: 198,
    avgRating: 4.5,
    reviewCount: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    workerId: 'bangalore-5',
    name: 'Kiran Kumar',
    mobile: '9876543251',
    categoryId: 'carpenter',
    categoryName: 'Carpenter',
    townId: 'bangalore-bangalore-urban-karnataka',
    townName: 'Bangalore',
    tehsilName: 'Whitefield',
    districtName: 'Bangalore Urban',
    stateName: 'Karnataka',
    pinCode: '560066',
    experienceYears: 10,
    isAvailable: true,
    isVerified: true,
    hasProfilePhoto: true,
    workPhotoCount: 4,
    hasWorkVideo: true,
    viewCount: 213,
    avgRating: 4.6,
    reviewCount: 49,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// All available category IDs for multi-category queries
const ALL_CATEGORY_IDS = [
  'plumber',
  'electrician',
  'painter',
  'raj-mistry',
  'carpenter',
  'welder',
  'ac-repair',
  'washing-machine',
  'cycle-repair',
  'bike-service',
];

interface UseWorkersParams {
  categoryId?: string;
  townId?: string;
  limit?: number;
}

interface WorkersResponse {
  workers: Worker[];
  nextCursor?: string;
}

export function useWorkers(params: UseWorkersParams = {}) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Use ref for cursor to avoid dependency issues
  const cursorRef = useRef<string | null>(null);

  const fetchWorkers = useCallback(async (reset = false) => {
    if (!params.categoryId) {
      setWorkers([]);
      return;
    }

    if (reset) {
      setIsLoading(true);
      cursorRef.current = null;
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.townId) queryParams.append('townId', params.townId);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (!reset && cursorRef.current) queryParams.append('cursor', cursorRef.current);

      const endpoint = `${API_ENDPOINTS.WORKERS}?${queryParams.toString()}`;
      const response = await api.get<WorkersResponse>(endpoint);

      if (response.success && response.data) {
        if (reset) {
          setWorkers(response.data.workers);
        } else {
          setWorkers((prev) => [...prev, ...response.data!.workers]);
        }
        cursorRef.current = response.data.nextCursor || null;
        setHasMore(!!response.data.nextCursor);
      } else {
        setError(response.error?.message || 'Failed to load workers');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [params.categoryId, params.townId, params.limit]);

  useEffect(() => {
    fetchWorkers(true);
  }, [fetchWorkers]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && cursorRef.current) {
      fetchWorkers(false);
    }
  }, [isLoadingMore, hasMore, fetchWorkers]);

  const refresh = useCallback(() => {
    fetchWorkers(true);
  }, [fetchWorkers]);

  return {
    workers,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * Hook to fetch workers from multiple categories in parallel.
 * Used when "All" category filter is selected.
 * Since backend requires both townId + categoryId, we make parallel API calls.
 */
interface UseWorkersMultiCategoryParams {
  townId?: string;
  categoryIds?: string[];
  enabled?: boolean;
}

export function useWorkersMultiCategory(params: UseWorkersMultiCategoryParams = {}) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { townId, categoryIds = ALL_CATEGORY_IDS, enabled = true } = params;

  const fetchAllWorkers = useCallback(async () => {
    if (!townId || !enabled) {
      setWorkers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Make parallel API calls for each category
      const promises = categoryIds.map(async (categoryId) => {
        const queryParams = new URLSearchParams();
        queryParams.append('categoryId', categoryId);
        queryParams.append('townId', townId);
        queryParams.append('limit', '10'); // Limit per category

        const endpoint = `${API_ENDPOINTS.WORKERS}?${queryParams.toString()}`;
        const response = await api.get<WorkersResponse>(endpoint);

        if (response.success && response.data) {
          return response.data.workers;
        }
        return [];
      });

      const results = await Promise.all(promises);

      // Flatten and merge all workers
      const allWorkers = results.flat();

      // Sort by rating (highest first), then by review count
      allWorkers.sort((a, b) => {
        if (b.avgRating !== a.avgRating) {
          return b.avgRating - a.avgRating;
        }
        return b.reviewCount - a.reviewCount;
      });

      setWorkers(allWorkers);
    } catch (err) {
      console.error('Multi-category fetch error:', err);
      setError('Failed to load workers');
    } finally {
      setIsLoading(false);
    }
  }, [townId, categoryIds, enabled]);

  useEffect(() => {
    fetchAllWorkers();
  }, [fetchAllWorkers]);

  const refresh = useCallback(() => {
    fetchAllWorkers();
  }, [fetchAllWorkers]);

  return {
    workers,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Combined hook that handles both single category and multi-category queries.
 * When categoryId is 'all' or undefined, fetches from all categories.
 */
interface UseNearbyWorkersParams {
  townId?: string;
  categoryId?: string; // 'all' or specific category
}

export function useNearbyWorkers(params: UseNearbyWorkersParams) {
  const { townId, categoryId } = params;
  const isAllCategories = !categoryId || categoryId === 'all';

  // Mock data state
  const [mockWorkers, setMockWorkers] = useState<Worker[]>([]);
  const [mockLoading, setMockLoading] = useState(true);

  // Filter mock data based on townId and category
  // Logic: City must be selected first, then category filter is applied
  useEffect(() => {
    if (USE_MOCK_DATA) {
      setMockLoading(true);
      // Simulate network delay
      const timer = setTimeout(() => {
        // Step 1: City filter is required - no city = no workers
        if (!townId) {
          setMockWorkers([]);
          setMockLoading(false);
          return;
        }

        // Step 2: Filter by townId - support multiple townIds (comma-separated)
        const townIds = townId.split(',').map(id => id.trim());
        let filtered = MOCK_WORKERS.filter(w => townIds.includes(w.townId));

        // Step 3: Apply category filter (default is "all" which shows all categories)
        if (!isAllCategories) {
          filtered = filtered.filter(w => w.categoryId === categoryId);
        }

        setMockWorkers(filtered);
        setMockLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [townId, categoryId, isAllCategories]);

  // Single category hook
  const singleCategory = useWorkers({
    categoryId: isAllCategories ? undefined : categoryId,
    townId,
  });

  // Multi-category hook
  const multiCategory = useWorkersMultiCategory({
    townId,
    enabled: isAllCategories && !!townId && !USE_MOCK_DATA,
  });

  // Return mock data if enabled
  if (USE_MOCK_DATA) {
    return {
      workers: mockWorkers,
      isLoading: mockLoading,
      error: null,
      refresh: () => {
        setMockLoading(true);
        setTimeout(() => setMockLoading(false), 500);
      },
      hasMore: false,
      loadMore: () => {},
      isLoadingMore: false,
    };
  }

  // Return appropriate results based on selection
  if (isAllCategories) {
    return {
      workers: multiCategory.workers,
      isLoading: multiCategory.isLoading,
      error: multiCategory.error,
      refresh: multiCategory.refresh,
      hasMore: false, // Multi-category doesn't support pagination yet
      loadMore: () => {},
      isLoadingMore: false,
    };
  }

  return singleCategory;
}

export function useWorkerDetail(workerId: string | null) {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorker = useCallback(async () => {
    if (!workerId) return;

    setIsLoading(true);
    setError(null);

    // Use mock data if enabled
    if (USE_MOCK_DATA) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      const mockWorker = MOCK_WORKERS.find(w => w.workerId === workerId);
      if (mockWorker) {
        // Add bio for detail view
        setWorker({
          ...mockWorker,
          bio: `Experienced ${mockWorker.categoryName.toLowerCase()} with ${mockWorker.experienceYears} years of expertise. Available for all types of ${mockWorker.categoryName.toLowerCase()} work in ${mockWorker.townName} and nearby areas. Quality work guaranteed with affordable pricing.`,
        });
      } else {
        setError('Worker not found');
      }
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<{ worker: Worker }>(API_ENDPOINTS.WORKER_BY_ID(workerId));

      if (response.success && response.data) {
        setWorker(response.data.worker);
      } else {
        setError(response.error?.message || 'Worker not found');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  return {
    worker,
    isLoading,
    error,
    refetch: fetchWorker,
  };
}
