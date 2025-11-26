// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateVerification {
    struct Certificate {
        string studentId;
        string fileHash;
        string college;
        bool isVerified;
    }

    mapping(string => Certificate) public certificates; // Maps file hashes to Certificate details
    address public admin;

    event CertificateUploaded(string fileHash, string studentId, string college);
    event CertificateVerified(string fileHash, bool isVerified);

    constructor() {
        admin = msg.sender; // Set deployer as admin
    }

    // Function to upload a certificate
    function uploadCertificate(string memory _studentId, string memory _fileHash, string memory _college) public {
        require(bytes(certificates[_fileHash].fileHash).length == 0, "Certificate already exists");

        certificates[_fileHash] = Certificate(_studentId, _fileHash, _college, false);
        emit CertificateUploaded(_fileHash, _studentId, _college);
    }

    // Function to verify a certificate (only admin/college)
    function verifyCertificate(string memory _fileHash) public {
        require(msg.sender == admin, "Only admin can verify certificates");
        require(bytes(certificates[_fileHash].fileHash).length > 0, "Certificate not found");

        certificates[_fileHash].isVerified = true;
        emit CertificateVerified(_fileHash, true);
    }

    // Function to check if a certificate is verified
    function isCertificateVerified(string memory _fileHash) public view returns (bool) {
        return certificates[_fileHash].isVerified;
    }
}
