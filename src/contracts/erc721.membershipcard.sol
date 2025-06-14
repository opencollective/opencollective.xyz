// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Membership Cards
 * @author @xdamman
 * 
 * This creates a membership card for a given address.
 * A card is valid for a given duration, and can be renewed by the owner or an admin.
 * If a card has expired for a given address, a new one can be minted.
 * At all times, there is only one active card per address (but an address can have multiple cards if they have expired)
 */

contract MembershipCards is ERC721, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public nextTokenId = 1;
    uint256 public defaultExpiryDuration; // in seconds
    string public baseURI;

    struct CardData {
        uint256 mintedAt;
        uint256 expiryDate;
        address owner;
    }

    mapping(uint256 => CardData) public data;
    mapping(address => uint256) public addressToTokenId;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint256 _defaultExpiryDuration
    ) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        baseURI = _baseURI;
        defaultExpiryDuration = _defaultExpiryDuration > 0 ? _defaultExpiryDuration : 365 days;
    }

    function mint(address to) external onlyRole(ADMIN_ROLE) {
        uint256 existingTokenId = addressToTokenId[to];
    
        if (existingTokenId != 0) {
            CardData memory cardData = data[existingTokenId];
            require(cardData.expiryDate < block.timestamp, "Already has an active membership");
        }

        uint256 tokenId = nextTokenId++;
        addressToTokenId[to] = tokenId;
        _safeMint(to, tokenId);

        data[tokenId] = CardData({
            mintedAt: block.timestamp,
            expiryDate: block.timestamp + defaultExpiryDuration,
            owner: to
        });
    }

    function burn(address addr) external onlyRole(ADMIN_ROLE) {
        uint256 tokenId = addressToTokenId[addr];
        require(tokenId != 0, "Token does not exist");
        _burn(tokenId);
        delete addressToTokenId[addr];
        delete data[tokenId];
    }

    function getCardDataByTokenId(uint256 tokenId) external view returns (uint256 mintedAt, uint256 expiryDate, address owner) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        CardData memory membershipCard = data[tokenId];
        return (membershipCard.mintedAt, membershipCard.expiryDate, membershipCard.owner);
    }

    function getCardDataByAddress(address addr) external view returns (uint256 mintedAt, uint256 expiryDate, address owner) {
        uint256 tokenId = addressToTokenId[addr];
        CardData memory membershipCard = data[tokenId];
        return (membershipCard.mintedAt, membershipCard.expiryDate, owner);
    }

    function setBaseURI(string memory newBaseURI) external onlyRole(ADMIN_ROLE) {
        baseURI = newBaseURI;
    }

    function setExpiry(address addr, uint256 newExpiry) external onlyRole(ADMIN_ROLE) {
        uint256 tokenId = addressToTokenId[addr];
        require(tokenId != 0, "Address is not a member");
        data[tokenId].expiryDate = newExpiry;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return string(abi.encodePacked(baseURI, "/", _uint2str(tokenId)));
    }

    function _uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            bstr[--k] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        str = string(bstr);
    }

    // The following functions are required by Solidity
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Transfers ownership of the contract to a new address.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOwner != address(0), "New owner cannot be the zero address");
        require(newOwner != msg.sender, "New owner cannot be the current owner");
        
        // Grant roles to new owner
        _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
        _grantRole(ADMIN_ROLE, newOwner);
        
        // Revoke roles from current owner
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _revokeRole(ADMIN_ROLE, msg.sender);
    }
}