import React, { useState, useMemo } from 'react';
import { TitleHeader } from '../../components/TitleHeader';
import { ModernDropdown } from '../../components/ModernDropdown';
import { ScopedSearchBar, type ScopedSearchOption } from '../../components/ScopedSearchBar';
import { RotateCcw, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/shared-filters.css';

// Mock Data
// Mock Data - Robust Generation
const MOCK_PHOTOGRAPHERS = [
    { name: 'Hanna Björk', city: 'Stockholm', events: 4, revenue: 12500, published: 450, sold: 34, totalSold: 120, status: 'available' },
    { name: 'Klara Fors', city: 'Gothenburg', events: 2, revenue: 5600, published: 200, sold: 15, totalSold: 40, status: 'unavailable' },
    { name: 'Ida Holmgren', city: 'Malmö', events: 8, revenue: 24000, published: 890, sold: 78, totalSold: 200, status: 'available' },
    { name: 'Tove Lund', city: 'Uppsala', events: 1, revenue: 1200, published: 50, sold: 3, totalSold: 10, status: 'available' },
    { name: 'Sara Engström', city: 'Lund', events: 5, revenue: 15400, published: 600, sold: 45, totalSold: 150, status: 'available' },
    { name: 'Johan Lindahl', city: 'Västerås', events: 3, revenue: 8900, published: 320, sold: 25, totalSold: 80, status: 'unavailable' },
    { name: 'Erik Nyberg', city: 'Örebro', events: 2, revenue: 4500, published: 180, sold: 12, totalSold: 40, status: 'available' },
    { name: 'Mattias Berg', city: 'Linköping', events: 6, revenue: 18200, published: 750, sold: 60, totalSold: 180, status: 'available' },
    { name: 'Daniel Söder', city: 'Helsingborg', events: 1, revenue: 2800, published: 120, sold: 8, totalSold: 25, status: 'available' },
    { name: 'Per Hedman', city: 'Jönköping', events: 3, revenue: 9500, published: 350, sold: 28, totalSold: 90, status: 'unavailable' }
].map((p, i) => ({
    id: String(i + 1),
    ...p,
    email: `${p.name.toLowerCase().replace(' ', '.')}@gallopics.se`,
    // Use the convention from EventsList: Name + .jpg
    avatarUrl: `/images/${p.name}.jpg`,
    subEvents: [
        { id: `e${i}-1`, name: `${p.city} Horse Show`, published: Math.floor(p.published * 0.6), sold: `${Math.floor(p.sold * 0.6)}/${Math.floor(p.totalSold * 0.6)}`, revenue: Math.floor(p.revenue * 0.6) },
        ...(p.events > 1 ? [{ id: `e${i}-2`, name: `Summer Cup ${p.city}`, published: Math.floor(p.published * 0.4), sold: `${Math.floor(p.sold * 0.4)}/${Math.floor(p.totalSold * 0.4)}`, revenue: Math.floor(p.revenue * 0.4) }] : [])
    ]
}));


const CITY_COUNTY_MAP: Record<string, string> = {
    'Stockholm': 'stockholm',
    'Gothenburg': 'vastra-gotaland',
    'Malmö': 'skane',
    'Uppsala': 'uppsala',
    'Lund': 'skane',
    'Västerås': 'vastmanland',
    'Örebro': 'orebro',
    'Linköping': 'ostergotland',
    'Helsingborg': 'skane',
    'Jönköping': 'jonkoping'
};

export const Photographers: React.FC = () => {
    // Filters
    const [country, setCountryFilter] = useState('sweden');
    const [county, setCounty] = useState('all');
    const [city, setCity] = useState('all');
    const [status, setStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Expanded State
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        const next = new Set(expandedRows);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setExpandedRows(next);
    };

    const handleDelete = (name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            console.log('Deleted', name);
        }
    };

    // Derived Data
    const filteredPhotographers = useMemo(() => {
        return MOCK_PHOTOGRAPHERS.map(p => ({
            ...p,
            county: CITY_COUNTY_MAP[p.city] || 'other'
        })).filter(p => {
            const matchCounty = county === 'all' || p.county === county;
            const matchCity = city === 'all' || p.city.toLowerCase() === city.toLowerCase();
            const matchStatus = status === 'all' ||
                (status === 'available' && p.status === 'available') ||
                (status === 'unavailable' && p.status === 'unavailable');
            const matchSearch = !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.subEvents.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchCounty && matchCity && matchStatus && matchSearch;
        });
    }, [county, city, status, searchQuery]);

    // Search Options
    const searchOptions = useMemo<ScopedSearchOption[]>(() => {
        const pNames = MOCK_PHOTOGRAPHERS.map(p => ({ label: p.name, value: p.name, type: 'rider' as const }));
        const eNames = MOCK_PHOTOGRAPHERS.flatMap(p => p.subEvents).map(e => ({ label: e.name, value: e.name, type: 'horse' as const }));
        return [...pNames, ...eNames];
    }, []);

    const isResetDisabled = city === 'all' && status === 'all' && county === 'all' && searchQuery === '';

    return (
        <div className="pg-photographers-page">
            <TitleHeader variant="workspace" title="Photographers" subtitle={null} rightContent={null} />

            <div className="pg-grey-section">
                <div className="pg-grey-section-inner">
                    <div className="container">

                        {/* Filter Bar */}
                        <div className="filter-container">
                            <div className="filter-group">
                                <ModernDropdown
                                    label="Country"
                                    value={country}
                                    options={[{ label: 'Sweden', value: 'sweden' }]}
                                    onChange={setCountryFilter}
                                    placeholder="Country"
                                    variant="pill"
                                />
                                <ModernDropdown
                                    label="County"
                                    value={county}
                                    options={[
                                        { label: 'Any county', value: 'all' },
                                        { label: 'Stockholm', value: 'stockholm' },
                                        { label: 'Västra Götaland', value: 'vastra-gotaland' },
                                        { label: 'Skåne', value: 'skane' },
                                        { label: 'Uppsala', value: 'uppsala' },
                                        { label: 'Västmanland', value: 'vastmanland' },
                                        { label: 'Örebro', value: 'orebro' },
                                        { label: 'Östergötland', value: 'ostergotland' },
                                        { label: 'Jönköping', value: 'jonkoping' }
                                    ]}
                                    onChange={setCounty}
                                    placeholder="County"
                                    variant="pill"
                                />
                                <ModernDropdown
                                    label="City"
                                    value={city}
                                    options={[
                                        { label: 'Any city', value: 'all' },
                                        { label: 'Stockholm', value: 'stockholm' },
                                        { label: 'Gothenburg', value: 'gothenburg' },
                                        { label: 'Malmö', value: 'malmö' }
                                    ]}
                                    onChange={setCity}
                                    placeholder="City"
                                    variant="pill"
                                />
                                <ModernDropdown
                                    label="Status"
                                    value={status}
                                    options={[
                                        { label: 'Any status', value: 'all' },
                                        { label: 'Available', value: 'available' },
                                        { label: 'Unavailable', value: 'unavailable' }
                                    ]}
                                    onChange={setStatus}
                                    placeholder="Status"
                                    variant="pill"
                                />
                                <button
                                    className="filter-reset-btn"
                                    onClick={() => {
                                        setCity('all');
                                        setStatus('all');
                                        setSearchQuery('');
                                    }}
                                    title="Reset filters"
                                    disabled={isResetDisabled}
                                >
                                    <RotateCcw size={18} />
                                </button>
                            </div>

                            <div className="search-group">
                                <ScopedSearchBar
                                    currentValue={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    onSelect={setSearchQuery}
                                    placeholder="Search photographers or events"
                                    options={searchOptions}
                                />
                            </div>

                            <div className="filter-right">
                                Showing {filteredPhotographers.length} photographers
                            </div>
                        </div>

                        {/* Table */}
                        <div className="pg-photographers-card">
                            <table className="pg-photographers-table">
                                <thead>
                                    <tr>
                                        <th className="col-chevron"></th>
                                        <th className="col-name">Name</th>
                                        <th className="col-events text-right">Events</th>
                                        <th className="col-revenue text-right">Earnings (SEK)</th>
                                        <th className="col-published text-right">Published</th>
                                        <th className="col-sold text-right">Sold</th>
                                        <th className="col-status">Status</th>
                                        <th className="col-actions"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPhotographers.map(p => (
                                        <React.Fragment key={p.id}>
                                            <tr>
                                                <td className="col-chevron">
                                                    <button
                                                        className="pg-action-btn expand"
                                                        onClick={() => toggleRow(p.id)}
                                                    >
                                                        {expandedRows.has(p.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                    </button>
                                                </td>
                                                <td className="col-name">
                                                    <div className="pg-user-cell">
                                                        <img
                                                            src={(p as any).avatarUrl}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none'; // Hide broken image
                                                                (e.target as HTMLImageElement).parentElement?.classList.add('broken-avatar'); // Hook for CSS if needed
                                                            }}
                                                            alt=""
                                                            className="pg-user-avatar bg-[var(--color-border)]"
                                                        />
                                                        {/* We could add an initial fallback here if image hidden, but relying on bg color for now based on 'amateur' feedback implies we want clean images */}
                                                        <div className="pg-user-info-stack">
                                                            <Link to={`/photographer/${p.id}`} className="pg-user-link">
                                                                {p.name}
                                                            </Link>
                                                            <div className="pg-user-city">{(p as any).city}</div>
                                                            <div className="pg-user-email">{(p as any).email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="col-events text-right">{p.events}</td>
                                                <td className="col-revenue text-right">{p.revenue.toLocaleString().replace(/,/g, ' ')}</td>
                                                <td className="col-published text-right">{p.published}</td>
                                                <td className="col-sold text-right">{p.sold}/{p.totalSold}</td>
                                                <td className="col-status">
                                                    <span className={`pg-status-badge ${p.status}`}>
                                                        {p.status === 'unavailable' ? 'N/A' : 'Available'}
                                                    </span>
                                                </td>
                                                <td className="col-actions">
                                                    <button
                                                        className="pg-action-btn delete"
                                                        title="Delete photographer"
                                                        onClick={() => handleDelete(p.name)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRows.has(p.id) && (
                                                <tr className="pg-sub-table-row">
                                                    <td colSpan={8}>
                                                        <div className="pg-sub-table-container">
                                                            <table className="pg-sub-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Event Name</th>
                                                                        <th className="text-right">Published</th>
                                                                        <th className="text-right">Sold</th>
                                                                        <th className="text-right">Earnings (SEK)</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {p.subEvents.map(e => (
                                                                        <tr key={e.id}>
                                                                            <td>
                                                                                <Link to="/admin/events/1" className="pg-user-link text-[0.8125rem]">
                                                                                    {e.name}
                                                                                </Link>
                                                                            </td>
                                                                            <td className="text-right">{e.published}</td>
                                                                            <td className="text-right">{e.sold}</td>
                                                                            <td className="text-right">{e.revenue.toLocaleString().replace(/,/g, ' ')}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
