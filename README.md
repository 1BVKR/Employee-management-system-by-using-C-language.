//# Employee-management-system-by-using-C-language.
//Done a project of program with by using C language, with access of admin &amp; employee individually.  


#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define EMP_FILE "employees.dat"
#define ADMIN_FILE "admin.dat"
#define ADMIN_ID 9999
#define ADMIN_USERNAME "admin"

// --- Employee structure ---
typedef struct {
    char name[50];
    int id;
    char password[50];
    float salary;
    int leavesAllowed;
    int leavesTaken;
    int leavesPending;
    int leaveRequestStatus; // 0=None, 1=Pending, 2=Approved, 3=Rejected
    int isActive; // 1 active, 0 inactive
} Employee;

// --- Dynamic array for employees ---
Employee *employees = NULL;
int empCount = 0;
int empCapacity = 0;

char adminPassword[50] = "admin123"; // default, will be loaded from file if exists

// --- Utility declarations ---
void clearInputBuffer();
int findActiveEmployeeIndex(int id);
void displayEmployeeDetails(int index);
char* getLeaveStatusString(int status);

// --- Persistence ---
int loadEmployees();
int saveEmployees();
int loadAdminPassword();
int saveAdminPassword();

// --- Admin / Employee function declarations ---
void adminMenu();
void employeeLogin();
void addEmployee();
void updateEmployee();
void deleteEmployee();
void searchEmployee();
void viewAllEmployees();
void manageLeaveRequests();
void changeAdminPassword();
void employeeMenu(int index);
void requestLeave(int index);
void checkLeaveStatus(int index);
void changeEmployeePassword(int index);

// --- Main ---
int main() {
    // load persistent data
    loadEmployees();
    loadAdminPassword();

    int choice;
    while (1) {
        printf("====== Employee Management System (Persistent) ======\n");
        printf("1. Login as Admin\n");
        printf("2. Login as Employee\n");
        printf("3. Exit\n");
        printf("Enter your choice: ");

        if (scanf("%d", &choice) != 1) {
            printf("Invalid input. Please enter a number.\n");
            clearInputBuffer();
            continue;
        }
        clearInputBuffer();

        switch (choice) {
            case 1: adminMenu(); break;
            case 2: employeeLogin(); break;
            case 3:
                printf("Saving data and exiting...\n");
                saveEmployees();
                saveAdminPassword();
                // free memory
                free(employees);
                return 0;
            default:
                printf("Invalid choice!\n");
        }
    }
}

// --- Utility functions ---
void clearInputBuffer() {
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

int findActiveEmployeeIndex(int id) {
    for (int i = 0; i < empCount; i++) {
        if (employees[i].id == id && employees[i].isActive == 1) return i;
    }
    return -1;
}

void displayEmployeeDetails(int index) {
    if (index < 0 || index >= empCount) { printf("Invalid employee index.\n"); return; }
    Employee e = employees[index];
    printf("----------------------------------\n");
    printf("Name             : %s\n", e.name);
    printf("ID               : %d\n", e.id);
    printf("Salary           : %.2f\n", e.salary);
    printf("Leaves Allowed   : %d\n", e.leavesAllowed);
    printf("Leaves Taken     : %d\n", e.leavesTaken);
    printf("Leaves Pending   : %d\n", e.leavesPending);
    printf("Leave Status     : %s\n", getLeaveStatusString(e.leaveRequestStatus));
    printf("----------------------------------\n");
}

char* getLeaveStatusString(int status) {
    switch (status) {
        case 0: return "No Request";
        case 1: return "Pending Approval";
        case 2: return "Approved";
        case 3: return "Rejected";
        default: return "Unknown";
    }
}

// --- Persistence implementations ---
int ensureCapacity() {
    if (empCapacity == 0) {
        empCapacity = 4;
        employees = malloc(empCapacity * sizeof(Employee));
        if (!employees) { perror("malloc"); return 0; }
    } else if (empCount >= empCapacity) {
        empCapacity *= 2;
        Employee *tmp = realloc(employees, empCapacity * sizeof(Employee));
        if (!tmp) { perror("realloc"); return 0; }
        employees = tmp;
    }
    return 1;
}

int loadEmployees() {
    FILE *fp = fopen(EMP_FILE, "rb");
    if (!fp) {
        // No file yet; start with empty list
        employees = NULL;
        empCount = 0;
        empCapacity = 0;
        return 0;
    }

    // read count first
    int count = 0;
    if (fread(&count, sizeof(int), 1, fp) != 1) {
        fclose(fp);
        return 0;
    }

    empCount = 0;
    empCapacity = count > 0 ? count : 4;
    employees = malloc(empCapacity * sizeof(Employee));
    if (!employees) { fclose(fp); perror("malloc"); return 0; }

    if (count > 0) {
        if (fread(employees, sizeof(Employee), count, fp) != (size_t)count) {
            // partial read
            fclose(fp);
            free(employees);
            employees = NULL;
            empCount = 0;
            empCapacity = 0;
            return 0;
        }
        empCount = count;
    }

    fclose(fp);
    return 1;
}

int saveEmployees() {
    FILE *fp = fopen(EMP_FILE, "wb");
    if (!fp) { perror("fopen"); return 0; }

    if (fwrite(&empCount, sizeof(int), 1, fp) != 1) { fclose(fp); return 0; }
    if (empCount > 0) {
        if (fwrite(employees, sizeof(Employee), empCount, fp) != (size_t)empCount) { fclose(fp); return 0; }
    }

    fclose(fp);
    return 1;
}

int loadAdminPassword() {
    FILE *fp = fopen(ADMIN_FILE, "rb");
    if (!fp) return 0; // keep default
    if (fread(adminPassword, sizeof(adminPassword), 1, fp) != 1) {
        fclose(fp);
        return 0;
    }
    // ensure null-termination
    adminPassword[sizeof(adminPassword)-1] = '\0';
    fclose(fp);
    return 1;
}

int saveAdminPassword() {
    FILE *fp = fopen(ADMIN_FILE, "wb");
    if (!fp) { perror("fopen admin"); return 0; }
    if (fwrite(adminPassword, sizeof(adminPassword), 1, fp) != 1) { fclose(fp); return 0; }
    fclose(fp);
    return 1;
}

// --- Admin functions ---
void adminMenu() {
    char username[50];
    char password[50];

    printf("Enter Admin Username: ");
    fgets(username, sizeof(username), stdin);
    username[strcspn(username, "\n")] = 0;

    printf("Enter Admin Password: ");
    fgets(password, sizeof(password), stdin);
    password[strcspn(password, "\n")] = 0;

    if (strcmp(username, ADMIN_USERNAME) != 0 || strcmp(password, adminPassword) != 0) {
        printf("Invalid Admin Username or Password!\n");
        return;
    }

    printf("\nAdmin login successful. Welcome!\n");

    int choice;
    do {
        printf("\n--- Admin Menu ---\n");
        printf("1. Add Employee\n");
        printf("2. Update Employee\n");
        printf("3. Delete Employee\n");
        printf("4. Search Employee\n");
        printf("5. View All Employees\n");
        printf("6. Manage Leave Requests\n");
        printf("7. Change Admin Password\n");
        printf("8. Logout\n");
        printf("Enter your choice: ");

        if (scanf("%d", &choice) != 1) choice = -1;
        clearInputBuffer();

        switch (choice) {
            case 1: addEmployee(); saveEmployees(); break;
            case 2: updateEmployee(); saveEmployees(); break;
            case 3: deleteEmployee(); saveEmployees(); break;
            case 4: searchEmployee(); break;
            case 5: viewAllEmployees(); break;
            case 6: manageLeaveRequests(); saveEmployees(); break;
            case 7: changeAdminPassword(); saveAdminPassword(); break;
            case 8: printf("Exiting Admin Menu.\n"); break;
            default: printf("Invalid choice! Please try again.\n");
        }
    } while (choice != 8);
}

void addEmployee() {
    Employee e;
    printf("Enter Employee Name: ");
    fgets(e.name, sizeof(e.name), stdin);
    e.name[strcspn(e.name, "\n")] = 0;

    printf("Enter Employee ID: ");
    while (scanf("%d", &e.id) != 1) {
        printf("Invalid input. Please enter a number for ID: ");
        clearInputBuffer();
    }
    clearInputBuffer();

    if (findActiveEmployeeIndex(e.id) != -1) { printf("Employee ID %d already exists!\n", e.id); return; }

    // default password name+id
    char id_str[20]; sprintf(id_str, "%d", e.id);
    strncpy(e.password, e.name, sizeof(e.password)-1); e.password[sizeof(e.password)-1] = '\0';
    int remaining_space = sizeof(e.password) - strlen(e.password) - 1;
    if (remaining_space > 0) strncat(e.password, id_str, remaining_space);
    printf("Default password set to: %s\n", e.password);

    printf("Enter Salary: ");
    while (scanf("%f", &e.salary) != 1) { printf("Invalid input. Please enter a number for Salary: "); clearInputBuffer(); }
    clearInputBuffer();

    e.leavesAllowed = 5;
    e.leavesTaken = 0;
    e.leavesPending = 0;
    e.leaveRequestStatus = 0;
    e.isActive = 1;

    // append to dynamic array
    if (!ensureCapacity()) { printf("Failed to allocate memory. Employee not added.\n"); return; }
    employees[empCount++] = e;
    printf("Employee added successfully.\n");
}

void updateEmployee() {
    int id;
    printf("Enter Employee ID to update: ");
    if (scanf("%d", &id) != 1) { clearInputBuffer(); printf("Invalid ID.\n"); return; }
    clearInputBuffer();

    int index = findActiveEmployeeIndex(id);
    if (index == -1) { printf("Employee not found or is inactive.\n"); return; }

    printf("Updating Employee: %s (ID: %d)\n", employees[index].name, employees[index].id);
    printf("What do you want to update?\n1. Name\n2. Salary\n3. Leaves Allowed\n4. Reset Password\n5. Cancel\nEnter choice: ");

    int choice;
    if (scanf("%d", &choice) != 1) choice = -1;
    clearInputBuffer();

    switch(choice) {
        case 1:
            printf("Enter New Name: ");
            fgets(employees[index].name, sizeof(employees[index].name), stdin);
            employees[index].name[strcspn(employees[index].name, "\n")] = 0;
            printf("Name updated.\n");
            break;
        case 2:
            printf("Enter New Salary: ");
            while (scanf("%f", &employees[index].salary) != 1) { printf("Invalid input. Please enter a number: "); clearInputBuffer(); }
            clearInputBuffer();
            printf("Salary updated.\n");
            break;
        case 3:
            printf("Enter New Leaves Allowed: ");
            while (scanf("%d", &employees[index].leavesAllowed) != 1) { printf("Invalid input. Please enter a number: "); clearInputBuffer(); }
            clearInputBuffer();
            printf("Leaves updated.\n");
            break;
        case 4:
            printf("Enter New Password for Employee: ");
            fgets(employees[index].password, sizeof(employees[index].password), stdin);
            employees[index].password[strcspn(employees[index].password, "\n")] = 0;
            printf("Employee password reset successfully.\n");
            break;
        case 5:
            printf("Update cancelled.\n");
            break;
        default:
            printf("Invalid choice.\n");
    }
}

void deleteEmployee() {
    int id;
    printf("Enter Employee ID to delete: ");
    if (scanf("%d", &id) != 1) { clearInputBuffer(); printf("Invalid ID.\n"); return; }
    clearInputBuffer();

    int index = findActiveEmployeeIndex(id);
    if (index == -1) { printf("Employee not found or already inactive.\n"); return; }

    employees[index].isActive = 0;
    printf("Employee (ID: %d) has been deactivated.\n", id);
}

void searchEmployee() {
    int id;
    printf("Enter Employee ID to search: ");
    if (scanf("%d", &id) != 1) { clearInputBuffer(); printf("Invalid ID.\n"); return; }
    clearInputBuffer();

    int index = findActiveEmployeeIndex(id);
    if (index == -1) { printf("Employee not found or is inactive.\n"); return; }

    printf("Employee Found:\n");
    displayEmployeeDetails(index);
}

void viewAllEmployees() {
    printf("\n--- All Active Employees ---\n");
    int activeCount = 0;
    for (int i = 0; i < empCount; i++) {
        if (employees[i].isActive) {
            printf("ID: %-5d | Name: %s\n", employees[i].id, employees[i].name);
            activeCount++;
        }
    }
    if (activeCount == 0) printf("No active employees found.\n");
    printf("------------------------------\n");
}

void manageLeaveRequests() {
    printf("\n--- Pending Leave Requests ---\n");
    int pendingCount = 0;
    for (int i = 0; i < empCount; i++) {
        if (employees[i].isActive && employees[i].leaveRequestStatus == 1) {
            pendingCount++;
            printf("\nRequest from: %s (ID: %d)\n", employees[i].name, employees[i].id);
            printf("Days Requested: %d\n", employees[i].leavesPending);
            printf("Total Leaves Taken (if approved): %d / %d\n",
                   employees[i].leavesTaken + employees[i].leavesPending,
                   employees[i].leavesAllowed);

            char choice;
            printf("Approve (a) or Reject (r)? (any other key to skip): ");
            scanf(" %c", &choice);
            clearInputBuffer();

            if (choice == 'a' || choice == 'A') {
                if (employees[i].leavesTaken + employees[i].leavesPending > employees[i].leavesAllowed) {
                    printf("Warning: This exceeds allowed leaves. Approving anyway.\n");
                }
                employees[i].leavesTaken += employees[i].leavesPending;
                employees[i].leavesPending = 0;
                employees[i].leaveRequestStatus = 2;
                printf("Request Approved.\n");
            } else if (choice == 'r' || choice == 'R') {
                employees[i].leavesPending = 0;
                employees[i].leaveRequestStatus = 3;
                printf("Request Rejected.\n");
            } else {
                printf("Request skipped.\n");
            }
        }
    }
    if (pendingCount == 0) printf("No pending leave requests found.\n");
    printf("--------------------------------\n");
}

void changeAdminPassword() {
    char oldPass[50], newPass[50], confirmPass[50];
    printf("Enter OLD Admin Password: ");
    fgets(oldPass, sizeof(oldPass), stdin); oldPass[strcspn(oldPass, "\n")] = 0;
    if (strcmp(oldPass, adminPassword) != 0) { printf("Incorrect old password! Cannot change password.\n"); return; }
    printf("Enter NEW Admin Password: ");
    fgets(newPass, sizeof(newPass), stdin); newPass[strcspn(newPass, "\n")] = 0;
    printf("Confirm NEW Admin Password: ");
    fgets(confirmPass, sizeof(confirmPass), stdin); confirmPass[strcspn(confirmPass, "\n")] = 0;
    if (strcmp(newPass, confirmPass) != 0) { printf("New passwords do not match. Password not changed.\n"); return; }
    if (strlen(newPass) == 0) { printf("Password cannot be empty. Password not changed.\n"); return; }
    strcpy(adminPassword, newPass);
    saveAdminPassword();
    printf("Admin password changed successfully.\n");
}

// --- Employee functions ---
void employeeLogin() {
    int id;
    char password[50];
    printf("Enter your Employee ID: ");
    if (scanf("%d", &id) != 1) { clearInputBuffer(); printf("Invalid ID format.\n"); return; }
    clearInputBuffer();
    printf("Enter your Password: ");
    fgets(password, sizeof(password), stdin); password[strcspn(password, "\n")] = 0;
    int index = findActiveEmployeeIndex(id);
    if (index == -1) { printf("Invalid Employee ID or account is inactive.\n"); return; }
    if (strcmp(employees[index].password, password) != 0) { printf("Incorrect password!\n"); return; }
    printf("\nLogin successful. Welcome, %s!\n", employees[index].name);
    employeeMenu(index);
}

void employeeMenu(int index) {
    int choice;
    do {
        printf("\n--- Employee Menu ---\n");
        printf("1. View My Details\n");
        printf("2. Request Leave\n");
        printf("3. Check Leave Status\n");
        printf("4. Change My Password\n");
        printf("5. Logout\n");
        printf("Enter your choice: ");
        if (scanf("%d", &choice) != 1) choice = -1;
        clearInputBuffer();

        switch (choice) {
            case 1: printf("\nYour Details:\n"); displayEmployeeDetails(index); break;
            case 2: requestLeave(index); saveEmployees(); break;
            case 3: checkLeaveStatus(index); saveEmployees(); break;
            case 4: changeEmployeePassword(index); saveEmployees(); break;
            case 5: printf("Logging out. Goodbye, %s!\n", employees[index].name); break;
            default: printf("Invalid choice! Please try again.\n");
        }
    } while (choice != 5);
}

void requestLeave(int index) {
    if (employees[index].leaveRequestStatus == 1) { printf("You already have a leave request pending approval.\n"); return; }
    int days;
    printf("Enter number of days to request: ");
    if (scanf("%d", &days) != 1 || days <= 0) { clearInputBuffer(); printf("Invalid number of days.\n"); return; }
    clearInputBuffer();
    int totalLeaves = employees[index].leavesTaken + days;
    if (totalLeaves > employees[index].leavesAllowed) {
        printf("Warning: This request exceeds your total allowed leaves (%d).\n", employees[index].leavesAllowed);
        printf("You can still submit it for admin review.\n");
    } else {
        printf("Total leaves after this request: %d / %d\n", totalLeaves, employees[index].leavesAllowed);
    }
    employees[index].leavesPending = days;
    employees[index].leaveRequestStatus = 1;
    printf("Leave request for %d days submitted successfully.\n", days);
    printf("It is now pending admin approval.\n");
}

void checkLeaveStatus(int index) {
    printf("\n--- Your Leave Status ---\n");
    printf("Status: %s\n", getLeaveStatusString(employees[index].leaveRequestStatus));
    if (employees[index].leaveRequestStatus == 2) {
        printf("Your request was approved. Your total leaves taken is now: %d\n", employees[index].leavesTaken);
        employees[index].leaveRequestStatus = 0;
    } else if (employees[index].leaveRequestStatus == 3) {
        printf("Your request for %d days was rejected.\n", employees[index].leavesPending);
        employees[index].leaveRequestStatus = 0;
        employees[index].leavesPending = 0;
    } else if (employees[index].leaveRequestStatus == 1) {
        printf("Your request for %d days is still pending approval.\n", employees[index].leavesPending);
    }
}

void changeEmployeePassword(int index) {
    char oldPass[50], newPass[50], confirmPass[50];
    printf("Enter your OLD Password: ");
    fgets(oldPass, sizeof(oldPass), stdin); oldPass[strcspn(oldPass, "\n")] = 0;
    if (strcmp(oldPass, employees[index].password) != 0) { printf("Incorrect old password! Cannot change password.\n"); return; }
    printf("Enter your NEW Password: ");
    fgets(newPass, sizeof(newPass), stdin); newPass[strcspn(newPass, "\n")] = 0;
    printf("Confirm your NEW Password: ");
    fgets(confirmPass, sizeof(confirmPass), stdin); confirmPass[strcspn(confirmPass, "\n")] = 0;
    if (strcmp(newPass, confirmPass) != 0) { printf("New passwords do not match. Password not changed.\n"); return; }
    if (strlen(newPass) == 0) { printf("Password cannot be empty. Password not changed.\n"); return; }
    strcpy(employees[index].password, newPass);
    printf("Password changed successfully.\n");
}

