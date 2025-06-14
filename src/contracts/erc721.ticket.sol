// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketCards is ERC721, Ownable {
    uint256 public nextTokenId = 1;
    uint8 public defaultTickets;
    uint256 public defaultExpiryDuration; // in seconds
    string public baseURI;

    struct PassData {
        uint8 ticketsLeft;
        uint256 expiry;
    }

    mapping(uint256 => PassData) public ticketCards;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        uint8 _defaultTickets,
        uint256 _defaultExpiryDuration
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        baseURI = _baseURI;
        defaultTickets = _defaultTickets > 0 ? _defaultTickets : 1;
        defaultExpiryDuration = _defaultExpiryDuration > 0 ? _defaultExpiryDuration : 365 days;
    }

    function mint(address to) external onlyOwner {
        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);

        ticketCards[tokenId] = PassData({
            ticketsLeft: defaultTickets,
            expiry: block.timestamp + defaultExpiryDuration
        });
    }

    function useTicket(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ticketCards[tokenId].ticketsLeft > 0, "No tickets left");
        require(ticketCards[tokenId].expiry > block.timestamp, "Pass expired");

        ticketCards[tokenId].ticketsLeft -= 1;
    }

    function getTicketCardData(uint256 tokenId) external view returns (uint8 ticketsLeft, uint256 expiry) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        PassData memory ticketCard = ticketCards[tokenId];
        return (ticketCard.ticketsLeft, ticketCard.expiry);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
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
}