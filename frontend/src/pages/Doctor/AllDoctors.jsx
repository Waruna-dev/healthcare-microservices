import React, { useState, useEffect } from 'react';

const AllDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:5025/api/doctors');
      // const data = await response.json();
      // setDoctors(data.doctors);
      
      // Mock data for now
      setDoctors([
        { id: 1, name: "Dr. Sarah Johnson", specialty: "Cardiologist", experience: "12 years", rating: 4.8, fee: 150, available: true, image: "SJ" },
        { id: 2, name: "Dr. Michael Chen", specialty: "Neurologist", experience: "8 years", rating: 4.6, fee: 180, available: true, image: "MC" },
        { id: 3, name: "Dr. Emily Davis", specialty: "Pediatrician", experience: "10 years", rating: 4.9, fee: 120, available: false, image: "ED" },
        { id: 4, name: "Dr. James Wilson", specialty: "Orthopedics", experience: "15 years", rating: 4.7, fee: 200, available: true, image: "JW" },
        { id: 5, name: "Dr. Lisa Brown", specialty: "Dermatologist", experience: "7 years", rating: 4.5, fee: 130, available: true, image: "LB" },
        { id: 6, name: "Dr. Robert Taylor", specialty: "Ophthalmology", experience: "9 years", rating: 4.4, fee: 140, available: false, image: "RT" },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setLoading(false);
    }
  };

  const specialties = [...new Set(doctors.map(d => d.specialty))];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === '' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Doctors</h2>
        <p className="text-gray-500 mt-1">Browse and connect with healthcare professionals</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:w-64">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {doctor.image}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{doctor.name}</h3>
                <p className="text-blue-600 text-sm">{doctor.specialty}</p>
                <div className="flex items-center mt-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm text-gray-600 ml-1">{doctor.rating}</span>
                  <span className="text-xs text-gray-400 ml-2">{doctor.experience} exp</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-gray-800">${doctor.fee}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    doctor.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {doctor.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                  View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No doctors found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default AllDoctors;