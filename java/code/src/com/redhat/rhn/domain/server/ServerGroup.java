/*
 * Copyright (c) 2009--2014 Red Hat, Inc.
 *
 * This software is licensed to you under the GNU General Public License,
 * version 2 (GPLv2). There is NO WARRANTY for this software, express or
 * implied, including the implied warranties of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
 * along with this software; if not, see
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
 *
 * Red Hat trademarks are not licensed under GPLv2. No permission is
 * granted to use or replicate Red Hat trademarks that are incorporated
 * in this software or its documentation.
 */
package com.redhat.rhn.domain.server;

import com.redhat.rhn.GlobalInstanceHolder;
import com.redhat.rhn.domain.BaseDomainHelper;
import com.redhat.rhn.domain.config.ConfigChannel;
import com.redhat.rhn.domain.org.Org;
import com.redhat.rhn.domain.user.User;
import com.redhat.rhn.manager.configuration.SaltConfigSubscriptionService;
import com.redhat.rhn.manager.configuration.SaltConfigurable;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Server - Class representation of the table rhnServer.
 *
 */
public class ServerGroup extends BaseDomainHelper implements SaltConfigurable  {

    public static final long UNLIMITED = Long.MAX_VALUE;

    private Long id;
    private String name;
    private String description;
    private ServerGroupType groupType;
    private Org org;
    private Set<Pillar> pillars = new HashSet<>();

    /**
     * Getter for id
     * @return Long to get
     */
    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * Setter for id
     * @param idIn to set
     */
    public void setId(Long idIn) {
        this.id = idIn;
    }

    /**
     * Getter for name
     * @return String to get
     */
    @Override
    public String getName() {
        return this.name;
    }

    /**
     * Setter for name
     * @param nameIn to set
     */
    public void setName(String nameIn) {
        this.name = nameIn;
    }

    /**
     * Getter for description
     * @return String to get
     */
    public String getDescription() {
        return this.description;
    }

    /**
     * Setter for description
     * @param descriptionIn to set
     */
    public void setDescription(String descriptionIn) {
        this.description = descriptionIn;
    }

    /**
     * @return Returns the org.
     */
    public Org getOrg() {
        return org;
    }

    /**
     * @param orgIn The org to set.
     */
    public void setOrg(Org orgIn) {
        this.org = orgIn;
    }

    /**
     * @return Returns the groupType.
     */
    public ServerGroupType getGroupType() {
        return groupType;
    }

    /**
     * Note this is to be set by hibernate only
     * @param groupTypeIn The groupType to set.
     */
    protected void setGroupType(ServerGroupType groupTypeIn) {
        this.groupType = groupTypeIn;
    }

    /**
     * Returns the set of servers associated to the group
     * Note this is readonly set because we DONOT
     * want you to modify this set.
     * @return a list of Servers which are members of the group.
     */
    public List<Server> getServers() {
        return GlobalInstanceHolder.SERVER_GROUP_MANAGER.
                                listServers(this);
    }

    /**
     * Returns true if this server group is a User Managed
     * false if its Entitlement Managed.
     * @return true if its managed
     */
    public boolean isManaged() {
        return getGroupType() == null;
    }

    /**
     * the number of current servers
     * @return Long number for current servers
     */
    public Long getCurrentMembers() {
        return ServerGroupFactory.getCurrentMembers(this);
    }

    /**
     * @inheritDoc
     */
    @Override
    public void subscribeConfigChannels(List<ConfigChannel> configChannelList, User user) {
        SaltConfigSubscriptionService.subscribeChannels(this, configChannelList, user);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void unsubscribeConfigChannels(List<ConfigChannel> configChannelList, User user) {
        SaltConfigSubscriptionService.unsubscribeChannels(this, configChannelList, user);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setConfigChannels(List<ConfigChannel> configChannelList, User user) {
        SaltConfigSubscriptionService.setConfigChannels(this, configChannelList, user);
    }

    /**
     * @return Returns the org Id.
     */
    public Long getOrgId() {
        return org.getId();
    }

    /**
     * @return value of pillars
     */
    public Set<Pillar> getPillars() {
        return pillars;
    }

    /**
     * @param pillarsIn value of pillars
     */
    public void setPillars(Set<Pillar> pillarsIn) {
        pillars.clear();
        pillars.addAll(pillarsIn);
    }

    /**
     * Get the pillar corresponding to a category.
     *
     * @param category the category of the pillar to look for
     * @return the pillar if found
     */
    public Optional<Pillar> getPillarByCategory(String category) {
        return pillars.stream().filter(pillar -> pillar.getCategory().equals(category)).findFirst();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int hashCode() {
        return new HashCodeBuilder().append(getId())
                                    .append(getName())
                                    .append(getDescription())
                                    .append(getOrg())
                                    .append(getGroupType())
                                    .toHashCode();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean equals(Object other) {
        if (!(other instanceof ServerGroup castOther)) {
            return false;
        }
        return new EqualsBuilder().append(getId(), castOther.getId())
                                  .append(getName(), castOther.getName())
                                  .append(getDescription(), castOther.getDescription())
                                  .append(getOrg(), castOther.getOrg())
                                  .append(getGroupType(), castOther.getGroupType())
                                  .isEquals();

    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String toString() {
        return new ToStringBuilder(this).append("id", getId()).
                                          append("name", getName()).
                                          append("groupType", getGroupType()).
                                          toString();
    }


}
