$(document).ready(function() {
    // Backend API URL
    const API_URL = "http://localhost:3000/api/vehicles";

    // --- REUSABLE FUNCTIONS ---

    // 1. jQuery Effects: Custom Alert function
    function showAlert(message, type) {
        let alertClass = type === 'success' ? 'alert-success' : type === 'danger' ? 'alert-danger' : 'alert-warning';
        $('#alertBox')
            .removeClass('alert-success alert-danger alert-warning')
            .addClass(alertClass)
            .text(message)
            .slideDown(300)
            .delay(3000)
            .slideUp(300);
    }

    // 2. jQuery DOM Manipulation: Render the table
    function renderTable(data) {
        const tbody = $('#vehicleTableBody');
        tbody.empty(); // Clear old data
        
        // Ensure data is always an array (even if backend returns a single object)
        const vehicles = Array.isArray(data) ? data : [data];
        
        if (vehicles.length === 0 || !data) {
            tbody.append(`<tr><td colspan="6" class="text-center text-danger fw-bold py-4">No records found matching your search.</td></tr>`);
            return;
        }

        // Loop through data and build HTML rows
        vehicles.forEach(v => {
            tbody.append(`
                <tr>
                    <td class="fw-bold">${v.RegNo}</td>
                    <td>${v.FirstName} ${v.LastName}</td>
                    <td>${v.VehicleModel || 'N/A'}</td>
                    <td><span class="badge bg-secondary">${v.FuelType}</span></td>
                    <td>${v.NearestStation}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning edit-btn" data-reg="${v.RegNo}" data-station="${v.NearestStation}" data-fuel="${v.FuelType}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-reg="${v.RegNo}">Delete</button>
                    </td>
                </tr>
            `);
        });
    }

    // 3. jQuery AJAX: Fetch all records
    function fetchVehicles() {
        $.ajax({
            url: API_URL,
            method: 'GET',
            dataType: 'json',
            success: function(data) { renderTable(data); },
            error: function() { showAlert("Failed to connect to backend database.", "danger"); }
        });
    }

    // --- EVENT LISTENERS ---

    // Initial Data Load
    fetchVehicles(); 
    $('#loadDataBtn').on('click', fetchVehicles);

    // Register Form Submission
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        const regNo = $('#regNo').val().trim();
        
        // 4. jQuery Form Validation
        if(regNo.length < 5) {
            showAlert("Registration number is invalid! Must be at least 5 characters.", "warning");
            return;
        }

        // Packaging the JSON data
        const vehicleData = {
            RegNo: regNo,
            FirstName: $('#firstName').val().trim(),
            LastName: $('#lastName').val().trim(),
            Email: $('#email').val().trim(),
            NearestStation: $('#station').val().trim(),
            FuelType: $('#fuelType').val(),
            OwnerNIC: $('#nic').val().trim(),
            VehicleModel: $('#model').val().trim(),
            QRCode: regNo + "QR" // Auto-generated
        };

        // Send to backend via AJAX POST
        $.ajax({
            url: API_URL,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(vehicleData),
            success: function(res) {
                showAlert("Vehicle Registered Successfully!", "success");
                $('#registerForm')[0].reset(); // Clear form
                fetchVehicles(); // Refresh table
            },
            error: function(err) {
                let msg = err.responseJSON && err.responseJSON.message ? err.responseJSON.message : "Error saving vehicle.";
                showAlert(msg, "danger");
            }
        });
    });

    // Search Execution
    $('#searchBtn').on('click', function() {
        const criteria = $('#searchCriteria').val();
        const searchTerm = $('#searchInput').val().trim();

        if (searchTerm === "") {
            return showAlert("Please enter a search term first.", "warning");
        }

        $.ajax({
            url: `${API_URL}/${criteria}/${encodeURIComponent(searchTerm)}`,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                renderTable(data);
                showAlert("Search completed.", "success");
            },
            error: function() {
                renderTable([]);
                showAlert("No vehicles found matching that search.", "warning");
            }
        });
    });

    // Clear Search
    $('#clearBtn').on('click', function() {
        $('#searchInput').val('');
        fetchVehicles();
    });

    // Delete Record (Using Event Delegation for dynamic buttons)
    $('#vehicleTableBody').on('click', '.delete-btn', function() {
        const regNo = $(this).data('reg');
        if(confirm(`WARNING: Are you sure you want to permanently delete vehicle ${regNo}?`)) {
            $.ajax({
                url: `${API_URL}/regno/${regNo}`,
                method: 'DELETE',
                success: function() {
                    showAlert("Vehicle successfully deleted.", "success");
                    fetchVehicles();
                },
                error: function() { showAlert("Failed to delete vehicle.", "danger"); }
            });
        }
    });

    // Open Edit Modal & Populate Data
    $('#vehicleTableBody').on('click', '.edit-btn', function() {
        $('#editRegNo').val($(this).data('reg'));
        $('#editStation').val($(this).data('station'));
        $('#editFuelType').val($(this).data('fuel'));
        new bootstrap.Modal(document.getElementById('editModal')).show();
    });

    // Submit Updated Data
    $('#updateForm').on('submit', function(e) {
        e.preventDefault();
        const regNo = $('#editRegNo').val();
        const updatedData = {
            NearestStation: $('#editStation').val().trim(),
            FuelType: $('#editFuelType').val()
        };

        $.ajax({
            url: `${API_URL}/regno/${regNo}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedData),
            success: function() {
                showAlert("Vehicle details updated!", "success");
                $('.btn-close').click(); // Close Modal
                fetchVehicles(); // Refresh Table
            },
            error: function() { showAlert("Error updating vehicle details.", "danger"); }
        });
    });
});