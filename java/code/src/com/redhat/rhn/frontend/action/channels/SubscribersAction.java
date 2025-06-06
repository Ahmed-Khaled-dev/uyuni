/*
 * Copyright (c) 2014 Red Hat, Inc.
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
package com.redhat.rhn.frontend.action.channels;

import com.redhat.rhn.domain.access.AccessGroupFactory;
import com.redhat.rhn.domain.channel.Channel;
import com.redhat.rhn.domain.channel.ChannelFactory;
import com.redhat.rhn.domain.user.User;
import com.redhat.rhn.frontend.action.common.BadParameterException;
import com.redhat.rhn.frontend.dto.UserOverview;
import com.redhat.rhn.frontend.struts.RequestContext;
import com.redhat.rhn.frontend.struts.RhnAction;
import com.redhat.rhn.frontend.struts.StrutsDelegate;
import com.redhat.rhn.frontend.taglibs.list.helper.ListSessionSetHelper;
import com.redhat.rhn.frontend.taglibs.list.helper.Listable;
import com.redhat.rhn.frontend.xmlrpc.PermissionCheckFailureException;
import com.redhat.rhn.manager.channel.ChannelManager;
import com.redhat.rhn.manager.user.UserManager;

import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


/**
 * SubscribersAction
 */
public class SubscribersAction extends RhnAction implements Listable<UserOverview> {


    /** {@inheritDoc} */
    @Override
    public ActionForward execute(ActionMapping mapping,
                                 ActionForm formIn,
                                 HttpServletRequest request,
                                 HttpServletResponse response) {

        RequestContext requestContext = new RequestContext(request);
        User user = requestContext.getCurrentUser();

        Long cid = Long.parseLong(request.getParameter(RequestContext.CID));
        Channel currentChan = ChannelFactory.lookupByIdAndUser(cid, user);
        if (currentChan == null) {
             throw new BadParameterException("Invalid cid parameter:" + cid);
        }

        request.setAttribute("channel_name", currentChan.getName());
        request.setAttribute(RequestContext.CID, cid);

        Map<String, Object> params = makeParamMap(request);
        params.put(RequestContext.CID, cid);

        ListSessionSetHelper helper = new ListSessionSetHelper(this, request, params);
        helper.ignoreEmptySelection();

        Set<String> preselected = new HashSet<>();
        for (Long uid : ChannelManager.listChannelSubscriberIdsForChannel(
                                                user.getOrg(), currentChan)) {
            preselected.add(uid.toString());
        }
        helper.preSelect(preselected);
        helper.execute();

        if (helper.isDispatched()) {
            // make sure the user has enough rights to change channel managers
            if (!(UserManager.verifyChannelAdmin(user, currentChan) ||
                    user.isMemberOf(AccessGroupFactory.CHANNEL_ADMIN))) {
                  throw new PermissionCheckFailureException();
            }

            long updated = 0;
            // remove channel subscribers
            for (String valueIn : (Iterable<String>) helper.getRemovedKeys()) {
                Long uid = Long.valueOf(valueIn);
                if (!UserManager.isMemberOf(uid, AccessGroupFactory.CHANNEL_ADMIN)) {
                    user.getOrg().removeChannelPermissions(uid, currentChan.getId(),
                            ChannelManager.QRY_ROLE_SUBSCRIBE);
                }
                updated++;
            }

            // add channel subscribers
            for (String oIn : (Iterable<String>) helper.getAddedKeys()) {
                Long uid = Long.valueOf(oIn);
                if (!UserManager.isMemberOf(uid, AccessGroupFactory.CHANNEL_ADMIN)) {
                    user.getOrg().removeChannelPermissions(uid, currentChan.getId(),
                            ChannelManager.QRY_ROLE_SUBSCRIBE);
                    user.getOrg().resetChannelPermissions(uid, currentChan.getId(),
                            ChannelManager.QRY_ROLE_SUBSCRIBE);
                }
                updated++;
            }
            if (updated > 0) {
                createSuccessMessage(request, "channels.subscribers.updated",
                        String.valueOf(updated));
            }
            return StrutsDelegate.getInstance().forwardParams(
                    mapping.findForward("submitted"), params);
        }


        return StrutsDelegate.getInstance().forwardParams(
                mapping.findForward("default"), params);
    }

    /** {@inheritDoc} */
    @Override
    public List<UserOverview> getResult(RequestContext context) {
        User currentUser = context.getCurrentUser();
        List<UserOverview> userList = UserManager.activeInOrg2(currentUser);
        for (UserOverview uo : userList) {
            uo.setSelectable(true);
            uo.setDisabled(UserManager.isMemberOf(uo.getId(), AccessGroupFactory.CHANNEL_ADMIN));
        }
        return userList;
    }
}
